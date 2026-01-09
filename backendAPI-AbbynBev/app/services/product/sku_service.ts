import ProductVariant from '#models/product_variant'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class SkuService {
  async generateVariantSku(masterSku: string, barcode: string, trx?: TransactionClientContract) {
    const baseSku = `${masterSku}-${barcode}`

    let counter = 1
    let sku = baseSku

    const q = () => ProductVariant.query(trx ? { client: trx } : {})

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await q().where('sku', sku).first()
      if (!existing) return sku

      counter++
      sku = `${baseSku}-${counter}`
    }
  }
}
