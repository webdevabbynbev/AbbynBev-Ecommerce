import db from '@adonisjs/lucid/services/db'
import ProductVariant from '#models/product_variant'
import StockMovement from '#models/stock_movement'

type Trx = any

export type StockMovementType = 'sale' | 'pos_sale' | 'adjustment' | 'restore' | 'cancel' | 'refund'

export default class StockService {
  public async adjustVariantStock(
    params: {
      variantId: number
      delta: number // + tambah stock, - kurangi stock
      type: StockMovementType
      relatedId?: number | null
      note?: string | null
    },
    trx?: Trx
  ) {
    const client = trx ? trx : db

    const variant = await ProductVariant.query({ client })
      .where('id', params.variantId)
      .forUpdate()
      .first()

    if (!variant) {
      const err: any = new Error('Variant not found')
      err.httpStatus = 404
      throw err
    }

    const current = Number(variant.stock) || 0
    const next = current + Number(params.delta)

    if (next < 0) {
      const err: any = new Error('Insufficient stock')
      err.httpStatus = 400
      throw err
    }

    variant.stock = next
    trx ? await variant.useTransaction(trx).save() : await variant.save()

    const mv = new StockMovement()
    mv.productVariantId = variant.id
    mv.change = Number(params.delta)
    mv.type = params.type
    mv.relatedId = params.relatedId ?? null
    mv.note = params.note ?? null
    trx ? await mv.useTransaction(trx).save() : await mv.save()

    return variant
  }
}
