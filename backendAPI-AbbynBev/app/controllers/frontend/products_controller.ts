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
          q.where('products.is_flash_sale', isFlashSale === 'true' ? 1 : isFlashSale)
        })
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
            // NOTE: untuk listing, biarkan ini dulu.
            // kalau kamu mau listing pakai image dari variant, baru preload variants.medias (lebih berat)
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
    } catch (error: any) {
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
        .where((q) => {
          q.where('products.path', path).orWhere('products.slug', path)
        })
        .preload('product', (q) => {
          q.apply((scopes) => scopes.active())
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
              variantLoader
                .preload('medias', (mq) => {
                  mq.apply((scopes) => scopes.active())
                  mq.orderBy('slot', 'asc')
                })
                .preload('attributes', (attributeLoader) => {
                  attributeLoader
                    .whereNull('attribute_values.deleted_at')
                    .whereRaw('variant_attributes.deleted_at is null')
                    .preload('attribute', (q) => q.whereNull('attributes.deleted_at'))
                })
            })
            .preload('discounts', (query) =>
              query.where('start_date', '<=', dateString).where('end_date', '>=', dateString)
            )

            // ❗️INI BOLEH kamu hapus kalau product.medias memang selalu kosong (product_id NULL)
            // tapi biarin juga gak masalah, cuma tidak kepakai di FE variant image
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

      // ✅ FIX 2: bikin field variantItems supaya FE kamu gampang ambil images per variant
      const p = productOnline.product.toJSON()
      const variants = Array.isArray(p?.variants) ? p.variants : []

      const variantItems = variants.map((v: any) => {
        const medias = Array.isArray(v?.medias) ? v.medias : []
        const images = medias.map((m: any) => m.url).filter(Boolean)

        return {
          id: v.id,
          label: v.sku || `VAR-${v.id}`,
          price: Number(v.price || 0),
          stock: Number(v.stock || 0),
          images,
          image: images[0] || p.image, // thumbnail utama variant
        }
      })

      return response.status(200).send({
        message: 'success',
        serve: {
          ...p,
          variantItems, // ✅ FE kamu pakai ini untuk gambar
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}