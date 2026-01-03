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

  public async upsert(product: Product, payload: CmsProductUpsertPayload, trx: TransactionClientContract) {
    if (!payload.medias?.length) return

    for (const media of payload.medias) {
      await ProductMedia.create(
        {
          productId: product.id,
          url: this.extractFileName(media.url),
          type: Number(media.type), // model expects number
          altText: product.name,
        },
        { client: trx }
      )
    }
  }
}
