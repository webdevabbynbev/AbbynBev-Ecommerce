// app/services/ecommerce/voucher_calculator.ts
import Voucher from '#models/voucher'
import { toNumber } from '../../utils/number.js'

export class VoucherCalculator {
  calculateVoucher(v: any, subTotal: number, shippingPrice: number) {
    if (!v) return 0

    const isPercentage = toNumber(v.isPercentage) === 1
    const type = toNumber(v.type)
    const percentage = toNumber(v.percentage)
    const maxDiscPrice = toNumber(v.maxDiscPrice)
    const fixedPrice = toNumber(v.price)

    if (isPercentage) {
      if (type === 2) {
        // diskon ongkir %
        const disc = Math.floor(shippingPrice * (percentage / 100))
        return Math.min(disc, maxDiscPrice || disc, shippingPrice)
      }
      // diskon subtotal %
      const disc = Math.floor(subTotal * (percentage / 100))
      return Math.min(disc, maxDiscPrice || disc)
    }

    // diskon nominal
    if (type === 2) return Math.min(fixedPrice, shippingPrice) // nominal ongkir
    return fixedPrice // nominal subtotal
  }

  generateGrandTotal(v: any, subTotal: number, shippingPrice: number) {
    return subTotal + shippingPrice - (this.calculateVoucher(v, subTotal, shippingPrice) || 0)
  }

  async decrementVoucher(trx: any, voucherId: number) {
    const voucherDb = await Voucher.query({ client: trx }).where('id', voucherId).first()
    if (voucherDb) {
      voucherDb.qty = Math.max(0, toNumber(voucherDb.qty) - 1)
      await voucherDb.useTransaction(trx).save()
    }
  }

  async restoreVoucher(trx: any, voucherId: number) {
    const v = await Voucher.query({ client: trx }).where('id', voucherId).forUpdate().first()
    if (v) {
      v.qty = toNumber(v.qty) + 1
      await v.useTransaction(trx).save()
    }
  }
}
