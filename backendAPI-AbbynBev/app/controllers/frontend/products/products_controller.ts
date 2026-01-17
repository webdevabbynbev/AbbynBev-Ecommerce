import ProductOnline from '#models/product_online'
import type { HttpContext } from '@adonisjs/core/http'
import { DiscountPricingService } from '#services/discount/discount_pricing_service'

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
            .preload('variants', (variantLoader) => {
              variantLoader
                .select(['id', 'price', 'stock', 'product_id'])
                .whereNull('product_variants.deleted_at')
            })
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

      // ✅ PENTING: ambil rows model (belum toJSON)
      const rows = productsQuery.all()

      // ✅ attach extraDiscount ke product preload (MODEL OBJECT)
      const svc = new DiscountPricingService()
      const products = (rows as any[]).map((row) => row?.product).filter(Boolean)

      if (products.length) {
        await svc.attachExtraDiscount(products as any[])
        console.log('DEBUG extraDiscount sample (LIST):', products?.[0]?.extraDiscount)
      }

      // ✅ baru serialize setelah attach
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
                .whereNull('product_variants.deleted_at')
                .preload('medias', (mq) => {
                  mq.apply((scopes) => scopes.active())
                  mq.orderBy('slot', 'asc')
                })
                .preload('attributes', (attributeLoader) => {
                  attributeLoader
                    .whereNull('attribute_values.deleted_at')
                    .preload('attribute', (aq) => aq.whereNull('attributes.deleted_at'))
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

      // ✅ ambil JSON dulu, lalu attach
      const p = productOnline.product.toJSON()

      const svc = new DiscountPricingService()
      await svc.attachExtraDiscount([p as any])

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
          image: images[0] || p.image,
        }
      })

      return response.status(200).send({
        message: 'success',
        serve: {
          ...p,
          variantItems,
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