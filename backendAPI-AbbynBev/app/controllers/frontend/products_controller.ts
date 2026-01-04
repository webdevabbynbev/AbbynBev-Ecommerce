import ProductOnline from '#models/product_online'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const name = queryString.name || ''
      const categoryType =
        typeof queryString.category_type === 'string'
          ? queryString.category_type.split(',')
          : queryString.category_type
      const sortBy = queryString.field || 'position'
      const isFlashSale = queryString.is_flash_sale
      const sortType = queryString.value || 'ASC'
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const perPage = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const now = new Date()
      now.setHours(now.getHours() + 7)
      const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

      const productsQuery = await ProductOnline.query()
        .where('product_onlines.is_active', true)
        .join('products', 'products.id', '=', 'product_onlines.product_id')
        .if(name, (q) => q.where('products.name', 'like', `%${name}%`))
        .if(categoryType, (q) => q.whereIn('products.category_type_id', categoryType))
        .if(isFlashSale, (q) => {
          // Jika isFlashSale bernilai 'true' atau '1', filter produknya
          q.where('products.is_flash_sale', isFlashSale === 'true' ? 1 : isFlashSale)
        })
        // ----------------------------------

        .preload('product', (q) => {
          q.apply((scopes) => scopes.active())
            .withCount('reviews', (reviewQuery) => reviewQuery.as('review_count'))
            .withAggregate('reviews', (reviewQuery) => reviewQuery.avg('rating').as('avg_rating'))
            .preload('reviews', (reviewQuery) => {
              reviewQuery
                .whereNull('deleted_at')
                .orderBy('created_at', 'desc')
                .preload('user', (userQuery) =>
                  userQuery.select(['id', 'first_name', 'last_name', 'photo_profile'])
                )
            })
            .preload('discounts', (query) =>
              query.where('start_date', '<=', dateString).where('end_date', '>=', dateString)
            )
            .preload('medias')
            .preload('categoryType')
            .preload('brand')
            .preload('persona')
            .preload('tags')
            .preload('concernOptions')
            .preload('profileOptions')
        })
        .orderByRaw(`products.${sortBy} IS NULL, products.${sortBy} ${sortType}`)
        .paginate(page, perPage)

      const { meta, data } = productsQuery.toJSON()

      return response.status(200).send({
        message: 'success',
        serve: { data, ...meta },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const rawPath = params['*']
      const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath

      if (!path) {
        return response.status(400).send({ message: 'Missing product path', serve: null })
      }

      const now = new Date()
      now.setHours(now.getHours() + 7)
      const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

      const productOnline = await ProductOnline.query()
        .where('product_onlines.is_active', true)
        .join('products', 'products.id', '=', 'product_onlines.product_id')
        // 🔥 support akses via /products/:path maupun /products/:slug
        .where((q) => {
          q.where('products.path', path).orWhere('products.slug', path)
        })
        .preload('product', (q) => {
          q.apply((scopes) => scopes.active())
            // redundant tapi aman: pastikan cocok by path/slug
            .where((q2) => {
              q2.where('products.path', path).orWhere('products.slug', path)
            })
            .withCount('reviews', (reviewQuery) => reviewQuery.as('review_count'))
            .withAggregate('reviews', (reviewQuery) => reviewQuery.avg('rating').as('avg_rating'))
            .preload('reviews', (reviewQuery) => {
              reviewQuery
                .whereNull('deleted_at')
                .orderBy('created_at', 'desc')
                .preload('user', (userQuery) =>
                  userQuery.select(['id', 'first_name', 'last_name', 'photo_profile'])
                )
            })
            .preload('variants', (variantLoader) => {
              variantLoader.preload('attributes', (attributeLoader) => {
                attributeLoader
                  .whereNull('attribute_values.deleted_at')
                  .preload('attribute', (query) => query.whereNull('attributes.deleted_at'))
              })
            })
            .preload('discounts', (query) =>
              query.where('start_date', '<=', dateString).where('end_date', '>=', dateString)
            )
            .preload('medias')
            .preload('categoryType')
            .preload('brand')
            .preload('persona')
            .preload('tags')
            .preload('concernOptions')
            .preload('profileOptions')
        })
        .first()

      if (!productOnline || !productOnline.product) {
        return response.status(404).send({
          message: 'Product not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'success',
        serve: productOnline.product,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
