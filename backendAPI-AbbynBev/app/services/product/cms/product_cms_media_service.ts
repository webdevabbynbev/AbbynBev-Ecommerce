import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Product from '#models/product'
import ProductMedia from '#models/product_media'
import type { CmsProductUpsertPayload } from './cms_product_types.js'

export class ProductCmsMediaService {
  private extractFileName(url: string) {
    const urlParts = String(url || '').split('/')
    const fileNameWithQuery = urlParts[urlParts.length - 1] || ''
    return fileNameWithQuery.split('?')[0]
  }

  private normalizeMediaUrl(url: string) {
    const trimmed = String(url || '')
    if (!trimmed) return ''
    if (trimmed.startsWith('http')) {
      if (trimmed.includes('res.cloudinary.com')) {
        return trimmed
      }
      return this.extractFileName(trimmed)
    }
    return trimmed
  }

  public async upsert(product: Product, payload: CmsProductUpsertPayload, trx: TransactionClientContract) {
    if (!payload.medias?.length) return

    for (const media of payload.medias) {
      await ProductMedia.create(
        {
          productId: product.id,
          url: this.normalizeMediaUrl(media.url),
          type: Number(media.type), // model expects number
          altText: product.name,
        },
        { client: trx }
      )
    }
  }
}