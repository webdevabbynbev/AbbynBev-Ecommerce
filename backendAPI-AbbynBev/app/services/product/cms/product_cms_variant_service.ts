import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import { SkuService } from '../sku_service.js'
import type { CmsProductUpsertPayload, UpsertVariantsOptions } from './cms_product_types.js'

export class ProductCmsVariantService {
  constructor(private sku: SkuService) {}

  public async upsert(
    product: Product,
    payload: CmsProductUpsertPayload,
    trx: TransactionClientContract,
    opts?: UpsertVariantsOptions
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
        variant.price = Number(v.price)
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
        newVariant.price = Number(v.price)
        newVariant.stock = Number(v.stock)
        await newVariant.save()

        if (v.combination?.length) {
          await newVariant.related('attributes').sync(v.combination)
        }

        keepIds.push(newVariant.id)
      }
    }

    if (opts?.isUpdate && keepIds.length) {
      await ProductVariant.query({ client: trx })
        .where('product_id', product.id)
        .whereNotIn('id', keepIds)
        .delete()
    }
  }
}
