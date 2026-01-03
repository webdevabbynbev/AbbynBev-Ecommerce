import Product from '#models/product'
import type { CmsProductUpsertPayload } from './cms_product_types.js'

export class ProductCmsRelationService {
  public async sync(product: Product, payload: CmsProductUpsertPayload) {
    // behavior lama: hanya sync kalau ada length (kalau empty array tidak akan clear)
    if (payload.tag_ids?.length) await product.related('tags').sync(payload.tag_ids)

    if (payload.concern_option_ids?.length) {
      await product.related('concernOptions').sync(payload.concern_option_ids)
    }

    if (payload.profile_category_option_ids?.length) {
      await product.related('profileOptions').sync(payload.profile_category_option_ids)
    }
  }
}
