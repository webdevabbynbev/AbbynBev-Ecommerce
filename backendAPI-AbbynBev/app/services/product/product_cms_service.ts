import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import Product from '#models/product'
import ProductOnline from '#models/product_online'

import Helpers from '../../utils/helpers.js'
import { SeoMetaService } from './seo_meta_service.js'
import { SkuService } from './sku_service.js'

import { ProductCmsMetaService } from '#services/product/cms/product_cms_meta_service'
import { ProductCmsMediaService } from '#services/product/cms/product_cms_media_service'
import { ProductCmsDiscountService } from '#services/product/cms/product_cms_discount_service'
import { ProductCmsVariantService } from '#services/product/cms/product_cms_variant_service'
import { ProductCmsRelationService } from '#services/product/cms/product_cms_relation_service'
import type { CmsProductUpsertPayload } from '#services/product/cms/cms_product_types'

export type { CmsProductUpsertPayload } from './cms/cms_product_types.js'

export class ProductCmsService {
  private sku = new SkuService()
  private seo = new SeoMetaService()

  private meta = new ProductCmsMetaService(this.seo)
  private media = new ProductCmsMediaService()
  private discount = new ProductCmsDiscountService()
  private variant = new ProductCmsVariantService(this.sku)
  private relations = new ProductCmsRelationService()

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
      product.isFlashsale = this.meta.normalizeIsFlashsale(product.status, payload.is_flashsale)

      if (payload.category_type_id) product.categoryTypeId = payload.category_type_id
      if (payload.brand_id) product.brandId = payload.brand_id
      if (payload.persona_id) product.personaId = payload.persona_id
      product.masterSku = payload.master_sku || null

      product.path = await this.meta.buildProductPath(payload.category_type_id, product.slug, trx)
      await this.meta.applyMeta(product, payload)

      await product.save()

      await this.relations.sync(product, payload)
      await this.media.upsert(product, payload, trx)
      await this.discount.upsert(product, payload, trx)
      await this.variant.upsert(product, payload, trx)

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
      product.isFlashsale = this.meta.normalizeIsFlashsale(product.status, payload.is_flashsale)

      if (payload.category_type_id) product.categoryTypeId = payload.category_type_id
      if (payload.brand_id) product.brandId = payload.brand_id
      if (payload.persona_id) product.personaId = payload.persona_id
      product.masterSku = payload.master_sku || product.masterSku
      product.path = await this.meta.buildProductPath(payload.category_type_id, product.slug, trx)
      await this.meta.applyMeta(product, payload)

      await product.save()

      await this.relations.sync(product, payload)

      await this.variant.upsert(product, payload, trx, { isUpdate: true })

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
