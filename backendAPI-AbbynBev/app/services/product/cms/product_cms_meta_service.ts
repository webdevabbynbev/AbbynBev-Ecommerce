import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'


import Product from '#models/product'
import CategoryType from '#models/category_type'
import Helpers from '../../../utils/helpers.js'
import { SeoMetaService } from '../seo_meta_service.js'
import type { CmsProductUpsertPayload } from './cms_product_types.js'

export class ProductCmsMetaService {
  constructor(private seo: SeoMetaService) {}

  public normalizeIsFlashsale(status: string | undefined, isFlashsale: any) {
    if (status === 'draft') return false
    return Boolean(isFlashsale)
  }

  public async buildProductPath(
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

  public async applyMeta(product: Product, payload: CmsProductUpsertPayload) {
    // behavior lama: kalau meta_ai=1 -> generate pakai OpenAI
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

    // behavior lama: manual override kalau fieldnya dikirim
    if (payload.meta_title !== undefined) product.metaTitle = payload.meta_title || null
    if (payload.meta_description !== undefined)
      product.metaDescription = payload.meta_description || null
    if (payload.meta_keywords !== undefined) product.metaKeywords = payload.meta_keywords || null
  }
}
