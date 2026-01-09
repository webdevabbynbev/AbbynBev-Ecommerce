import ProductOnline from '#models/product_online'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ProductsController {

  private parseBoolNum(v: any): number | null {
    if (v === undefined || v === null) return null
    const s = String(v).trim().toLowerCase()
    if (s === '') return null
    if (s === 'true') return 1
    if (s === 'false') return 0
    const n = Number(s)
    if (Number.isFinite(n)) return n ? 1 : 0
    return null
  }

  private normalizeSortField(v: any): string {
    const allowed = new Set([
      'position',
      'popularity',
      'created_at',
      'updated_at',
      'name',
      'base_price',
      'weight',
    ])
    const s = String(v || '').trim()
    return allowed.has(s) ? s : 'position'
  }

  private normalizeSortDir(v: any): 'ASC' | 'DESC' {
    const s = String(v || '').trim().toUpperCase()
    return s === 'DESC' ? 'DESC' : 'ASC'
  }

  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()

      const name = queryString.name || ''
      const categoryType =
        typeof queryString.category_type === 'string'
          ? queryString.category_type.split(',')
          : queryString.category_type

      const sortBy = this.normalizeSortField(queryString.field || 'position')
      const sortType = this.normalizeSortDir(queryString.value || 'ASC')

      const isFlashSaleRaw = queryString.is_flash_sale ?? queryString.is_flashsale
      const isFlashSaleVal = this.parseBoolNum(isFlashSaleRaw) // 1 / 0 / null

      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const perPage = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dateString = DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-LL-dd HH:mm:ss')

      const productsQuery = await ProductOnline.query()
        .where('product_onlines.is_active', true)
        .join('products', 'products.id', '=', 'product_onlines.product_id')
        .if(name, (q) => q.where('products.name', 'like', `%${name}%`))
        .if(categoryType, (q) => q.whereIn('products.category_type_id', categoryType))
          
       .if(isFlashSaleVal !== null, (q) => { q.where('products.is_flashsale', isFlashSaleVal!) })
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

      const dateString = DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-LL-dd HH:mm:ss')

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
