// app/services/ecommerce/voucher_calculator.ts
import Voucher from '#models/voucher'
import NumberUtils from '../../utils/number.js'

export class VoucherCalculator {
  calculateVoucher(v: any, subTotal: number, shippingPrice: number) {
    if (!v) return 0

    const isPercentage = NumberUtils.toNumber(v.isPercentage) === 1
    const type = NumberUtils.toNumber(v.type)
    const percentage = NumberUtils.toNumber(v.percentage)
    const maxDiscPrice = NumberUtils.toNumber(v.maxDiscPrice)
    const fixedPrice = NumberUtils.toNumber(v.price)

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
      voucherDb.qty = Math.max(0, NumberUtils.toNumber(voucherDb.qty) - 1)
      await voucherDb.useTransaction(trx).save()
    }
  }

  async restoreVoucher(trx: any, voucherId: number) {
    const v = await Voucher.query({ client: trx }).where('id', voucherId).forUpdate().first()
    if (v) {
      v.qty = NumberUtils.toNumber(v.qty) + 1
      await v.useTransaction(trx).save()
    }
  }
}