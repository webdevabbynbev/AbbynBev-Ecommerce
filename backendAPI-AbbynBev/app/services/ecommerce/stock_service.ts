import TransactionDetail from '#models/transaction_detail'
import ProductVariant from '#models/product_variant'
import Product from '#models/product'
import TransactionCart from '#models/transaction_cart'
import NumberUtils from '../../utils/number.js'

export class StockService {
  async reduceFromCarts(trx: any, carts: any[], transactionId: number) {
    for (const cart of carts as any[]) {
      const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
      if (!cart.productVariantId) continue

      const productVariant = await ProductVariant.query({ client: trx })
        .preload('product')
        .where('id', cart.productVariantId)
        .forUpdate()
        .first()

      if (!productVariant) {
        const err: any = new Error('Variant not found')
        err.httpStatus = 400
        throw err
      }

      if (productVariant.stock < qty) {
        const err: any = new Error(`Stock not enough for ${productVariant.product?.name || 'product'}`)
        err.httpStatus = 400
        throw err
      }

      productVariant.stock = productVariant.stock - qty
      await productVariant.useTransaction(trx).save()

      const transactionDetail = new TransactionDetail()
      transactionDetail.qty = qty
      transactionDetail.price = NumberUtils.toNumber(cart.price)
      transactionDetail.amount = (
        (NumberUtils.toNumber(cart.price) - NumberUtils.toNumber(cart.discount)) * qty
      ).toString()
      transactionDetail.discount = NumberUtils.toNumber(cart.discount)
      transactionDetail.attributes = cart.attributes ?? ''
      transactionDetail.transactionId = transactionId
      transactionDetail.productId = cart.productId ?? 0
      transactionDetail.productVariantId = cart.productVariantId
      await transactionDetail.useTransaction(trx).save()

      if (cart.productId) {
        const product = await Product.query({ client: trx }).where('id', cart.productId).first()
        if (product) {
          product.popularity = NumberUtils.toNumber(product.popularity) + 1
          await product.useTransaction(trx).save()
        }
      }

      await TransactionCart.query({ client: trx }).where('id', cart.id).delete()
    }
  }

  async restoreFromTransaction(trx: any, transactionId: number) {
    const details = await TransactionDetail.query({ client: trx }).where('transaction_id', transactionId)

    for (const d of details as any[]) {
      if (d.productVariantId) {
        const pv = await ProductVariant.query({ client: trx }).where('id', d.productVariantId).forUpdate().first()
        if (pv) {
          pv.stock = NumberUtils.toNumber(pv.stock) + NumberUtils.toNumber(d.qty)
          await pv.useTransaction(trx).save()
        }
      }

      if (d.productId) {
        const p = await Product.query({ client: trx }).where('id', d.productId).forUpdate().first()
        if (p) {
          p.popularity = Math.max(0, NumberUtils.toNumber(p.popularity) - 1)
          await p.useTransaction(trx).save()
        }
      }
    }
  }
}