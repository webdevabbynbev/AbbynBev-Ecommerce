import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import Product from '#models/product'
import ProductDiscount from '#models/product_discount'
import ProductMedia from '#models/product_media'
import ProductOnline from '#models/product_online'
import ProductVariant from '#models/product_variant'
import CategoryType from '#models/category_type'

import Helpers from '../../utils/helpers.js'
import { SeoMetaService } from './seo_meta_service.js'
import { SkuService } from './sku_service.js'

type VariantPayload = {
  id?: number
  barcode: string
  price: number | string
  stock: number
  combination?: number[]
}

type MediaPayload = {
  url: string
  type: number | string
}

type DiscountPayload = {
  type: number | string
  value: number | string
  max_value?: number | string
  start_date?: any
  end_date?: any
}

export type CmsProductUpsertPayload = {
  name: string
  description?: string
  weight?: number
  base_price: number
  status?: 'normal' | 'war' | 'draft'
  is_flashsale?: boolean
  category_type_id?: number
  brand_id?: number
  persona_id?: number
  master_sku?: string

  meta_ai?: 0 | 1
  meta_title?: string
  meta_description?: string
  meta_keywords?: string

  tag_ids?: number[]
  concern_option_ids?: number[]
  profile_category_option_ids?: number[]

  medias?: MediaPayload[]
  discounts?: DiscountPayload[]
  variants?: VariantPayload[]
}

export class ProductCmsService {
  constructor(
    private sku = new SkuService(),
    private seo = new SeoMetaService()
  ) {}

  private extractFileName(url: string) {
    const urlParts = String(url || '').split('/')
    const fileNameWithQuery = urlParts[urlParts.length - 1] || ''
    return fileNameWithQuery.split('?')[0]
  }

  private toDateTime(v: any): DateTime {
    if (!v) return DateTime.now()
    // luxon DateTime
    if (v instanceof DateTime) return v
    // JS Date
    if (v instanceof Date) return DateTime.fromJSDate(v)
    // timestamp
    if (typeof v === 'number') return DateTime.fromMillis(v)

    const s = String(v).trim()
    if (!s) return DateTime.now()

    const iso = DateTime.fromISO(s)
    if (iso.isValid) return iso

    // fallback parse (very permissive)
    const js = new Date(s)
    if (!isNaN(js.getTime())) return DateTime.fromJSDate(js)

    return DateTime.now()
  }

  private async buildProductPath(
    categoryTypeId: number | undefined,
    productSlug: string,
    trx?: TransactionClientContract
  ) {
    if (!categoryTypeId) return productSlug

    const category = await CategoryType.query(trx ? { client: trx } : {})
      .where('id', categoryTypeId)
      .first()

    const categorySlug = category
      ? await Helpers.generateSlug(category.name)
      : `category-${categoryTypeId}`

    return `${categorySlug}/${productSlug}`
  }

  private normalizeIsFlashsale(status: string | undefined, isFlashsale: any) {
    if (status === 'draft') return false
    return Boolean(isFlashsale)
  }

  private async applyMeta(product: Product, payload: CmsProductUpsertPayload) {
    if (payload.meta_ai === 1) {
      const meta = await this.seo.generateProductMeta({
        productName: payload.name,
        productDescription: payload.description || '',
      })

      if (meta) {
        product.metaTitle = meta.metaTitle
        product.metaDescription = meta.metaDescription
        product.metaKeywords = meta.metaKeywords
      }
      return
    }

    if (payload.meta_title !== undefined) product.metaTitle = payload.meta_title || null
    if (payload.meta_description !== undefined)
      product.metaDescription = payload.meta_description || null
    if (payload.meta_keywords !== undefined) product.metaKeywords = payload.meta_keywords || null
  }

  private async syncRelations(product: Product, payload: CmsProductUpsertPayload) {
    if (payload.tag_ids?.length) await product.related('tags').sync(payload.tag_ids)
    if (payload.concern_option_ids?.length)
      await product.related('concernOptions').sync(payload.concern_option_ids)
    if (payload.profile_category_option_ids?.length)
      await product.related('profileOptions').sync(payload.profile_category_option_ids)
  }

  private async upsertMedias(product: Product, payload: CmsProductUpsertPayload, trx: TransactionClientContract) {
    if (!payload.medias?.length) return

    for (const media of payload.medias) {
      await ProductMedia.create(
        {
          productId: product.id,
          url: this.extractFileName(media.url),
          type: Number(media.type), // FIX: model expects number
          altText: product.name,
        },
        { client: trx }
      )
    }
  }

  private async upsertDiscounts(
    product: Product,
    payload: CmsProductUpsertPayload,
    trx: TransactionClientContract
  ) {
    if (!payload.discounts?.length) return

    for (const d of payload.discounts) {
      await ProductDiscount.create(
        {
          productId: product.id,
          type: Number(d.type), // FIX: model expects number
          value: String(d.value), // FIX: model expects string
          maxValue: String((d as any).max_value ?? ''), // FIX: model expects string
          startDate: this.toDateTime((d as any).start_date), // FIX: DateTime
          endDate: this.toDateTime((d as any).end_date), // FIX: DateTime
        },
        { client: trx }
      )
    }
  }

  private async upsertVariants(
    product: Product,
    payload: CmsProductUpsertPayload,
    trx: TransactionClientContract,
    opts?: { isUpdate?: boolean }
  ) {
    if (!payload.variants?.length) return

    const keepIds: number[] = []

    for (const v of payload.variants) {
      const masterSku = product.masterSku || `PRD-${product.id}`

      if (v.id) {
        const variant = await ProductVariant.query({ client: trx })
          .where('id', v.id)
          .where('product_id', product.id)
          .first()

        if (!variant) continue

        variant.useTransaction(trx)
        variant.barcode = v.barcode
        variant.sku = await this.sku.generateVariantSku(masterSku, v.barcode, trx)
        variant.price = String(v.price) // FIX: model expects string
        variant.stock = Number(v.stock)
        await variant.save()

        if (v.combination?.length) {
          await variant.related('attributes').sync(v.combination)
        }

        keepIds.push(variant.id)
      } else {
        const sku = await this.sku.generateVariantSku(masterSku, v.barcode, trx)

        const newVariant = new ProductVariant()
        newVariant.useTransaction(trx)
        newVariant.productId = product.id
        newVariant.sku = sku
        newVariant.barcode = v.barcode
        newVariant.price = String(v.price) // FIX
        newVariant.stock = Number(v.stock)
        await newVariant.save()

        if (v.combination?.length) {
          await newVariant.related('attributes').sync(v.combination)
        }

        keepIds.push(newVariant.id)
      }
    }

    // FIX BUG: variant baru ikut kehapus kalau cuma pakai incomingIds lama
    if (opts?.isUpdate && keepIds.length) {
      await ProductVariant.query({ client: trx })
        .where('product_id', product.id)
        .whereNotIn('id', keepIds)
        .delete()
    }
  }

  async create(payload: CmsProductUpsertPayload) {
    return db.transaction(async (trx) => {
      const product = new Product()
      product.useTransaction(trx)

      product.name = payload.name
      product.slug = await Helpers.generateSlug(payload.name)
      product.description = payload.description || null
      product.weight = payload.weight || 0
      product.basePrice = payload.base_price
      product.status = payload.status || 'draft'
      product.isFlashsale = this.normalizeIsFlashsale(product.status, payload.is_flashsale)

      if (payload.category_type_id) product.categoryTypeId = payload.category_type_id
      if (payload.brand_id) product.brandId = payload.brand_id
      if (payload.persona_id) product.personaId = payload.persona_id
      product.masterSku = payload.master_sku || null

      product.path = await this.buildProductPath(payload.category_type_id, product.slug, trx)
      await this.applyMeta(product, payload)

      await product.save()

      await this.syncRelations(product, payload)
      await this.upsertMedias(product, payload, trx)
      await this.upsertDiscounts(product, payload, trx)
      await this.upsertVariants(product, payload, trx)

      return product
    })
  }

  async update(productId: number, payload: CmsProductUpsertPayload) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx })
        .apply((scopes) => scopes.active())
        .where('id', productId)
        .first()

      if (!product) return null

      product.useTransaction(trx)

      product.name = payload.name
      product.slug = await Helpers.generateSlug(payload.name)
      product.description = payload.description || null
      product.weight = payload.weight || 0
      product.basePrice = payload.base_price
      product.status = (payload.status || product.status) as any
      product.isFlashsale = this.normalizeIsFlashsale(product.status, payload.is_flashsale)

      if (payload.category_type_id) product.categoryTypeId = payload.category_type_id
      if (payload.brand_id) product.brandId = payload.brand_id
      if (payload.persona_id) product.personaId = payload.persona_id
      product.masterSku = payload.master_sku || product.masterSku

      product.path = await this.buildProductPath(payload.category_type_id, product.slug, trx)
      await this.applyMeta(product, payload)

      await product.save()

      await this.syncRelations(product, payload)

      // keep behavior lama: medias & discounts cuma create (kalau mau update juga, nanti kita bikin step lanjut)
      await this.upsertVariants(product, payload, trx, { isUpdate: true })

      return product
    })
  }

  async softDelete(productId: number) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx }).where('id', productId).first()
      if (!product) return null
      product.useTransaction(trx)
      await product.softDelete()
      return product
    })
  }

  async publish(productId: number) {
    return db.transaction(async (trx) => {
      const product = await Product.query({ client: trx })
        .apply((scopes) => scopes.active())
        .where('id', productId)
        .first()

      if (!product) return { product: null, online: null, reason: 'NOT_FOUND' as const }
      if (product.status === 'draft') return { product, online: null, reason: 'DRAFT' as const }

      const existing = await ProductOnline.query({ client: trx }).where('product_id', product.id).first()

      let published: ProductOnline
      if (existing) {
        existing.useTransaction(trx)
        existing.isActive = true
        existing.publishedAt = DateTime.now()
        await existing.save()
        published = existing
      } else {
        published = await ProductOnline.create(
          { productId: product.id, isActive: true, publishedAt: DateTime.now() },
          { client: trx }
        )
      }

      return { product, online: published, reason: 'OK' as const }
    })
  }

  async unpublish(productId: number) {
    return db.transaction(async (trx) => {
      const productOnline = await ProductOnline.query({ client: trx }).where('product_id', productId).first()
      if (!productOnline) return null

      productOnline.useTransaction(trx)
      productOnline.isActive = false
      await productOnline.save()
      return productOnline
    })
  }

  async updatePositions(updates: Array<{ id: number; order: number }>) {
    const batchSize = 100

    return db.transaction(async (trx) => {
      for (const upd of updates || []) {
        await Product.query({ client: trx }).where('id', upd.id).update({ position: Number(upd.order) })
      }

      let page = 1
      let hasMore = true

      while (hasMore) {
        const products = await Product.query({ client: trx })
          .orderBy('position', 'asc')
          .paginate(page, batchSize)

        if (products.all().length === 0) {
          hasMore = false
          break
        }

        const arr = products.all()
        for (let i = 0; i < arr.length; i++) {
          const product = arr[i]
          const newPosition = (page - 1) * batchSize + i
          if (product.position !== newPosition) {
            await Product.query({ client: trx }).where('id', product.id).update({ position: newPosition })
          }
        }

        page++
      }
    })
  }
}
