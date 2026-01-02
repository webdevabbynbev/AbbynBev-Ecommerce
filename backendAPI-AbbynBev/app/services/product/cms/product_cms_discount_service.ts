import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import Product from '#models/product'
import ProductDiscount from '#models/product_discount'
import type { CmsProductUpsertPayload } from './cms_product_types.js'

export class ProductCmsDiscountService {
  private toDateTime(v: any): DateTime {
    if (!v) return DateTime.now()
    if (v instanceof DateTime) return v
    if (v instanceof Date) return DateTime.fromJSDate(v)
    if (typeof v === 'number') return DateTime.fromMillis(v)

    const s = String(v).trim()
    if (!s) return DateTime.now()

    const iso = DateTime.fromISO(s)
    if (iso.isValid) return iso

    const js = new Date(s)
    if (!isNaN(js.getTime())) return DateTime.fromJSDate(js)

    return DateTime.now()
  }

  public async upsert(product: Product, payload: CmsProductUpsertPayload, trx: TransactionClientContract) {
    if (!payload.discounts?.length) return

    // behavior lama: always create (no delete/update)
    for (const d of payload.discounts) {
      await ProductDiscount.create(
        {
          productId: product.id,
          type: Number(d.type),
          value: String(d.value),
          maxValue: String((d as any).max_value ?? ''),
          startDate: this.toDateTime((d as any).start_date),
          endDate: this.toDateTime((d as any).end_date),
        },
        { client: trx }
      )
    }
  }
}
