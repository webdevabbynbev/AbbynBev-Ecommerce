import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import TransactionEcommerce from '#models/transaction_ecommerce'
import TransactionShipment from '#models/transaction_shipment'
import TransactionCart from '#models/transaction_cart'
import ProductOnline from '#models/product_online'
import UserAddress from '#models/user_address'

import { TransactionStatus } from '../../enums/transaction_status.js'
import NumberUtils from '../../utils/number.js'

import { VoucherCalculator } from './voucher_calculator.js'
import { StockService } from './stock_service.js'
import { MidtransService } from './midtrans_service.js'

function normalizeInt(v: any, fallback = 0) {
  const n = NumberUtils.toNumber(v, fallback)
  return Math.max(0, Math.round(n))
}

export class EcommerceCheckoutService {
  private voucherCalc = new VoucherCalculator()
  private stock = new StockService()
  private midtrans = new MidtransService()

  private generateTransactionNumber() {
    const date = new Date()
    const tahun = date.getFullYear()
    const bulan = (date.getMonth() + 1).toString().padStart(2, '0')
    const tanggal = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    return `AB${tahun}${bulan}${tanggal}${random}`
  }

  async createCheckout(user: any, payload: any) {
    return db.transaction(async (trx) => {
      const rawCartIds = payload.cart_ids ?? []
      const cartIds: number[] = Array.isArray(rawCartIds)
       ? rawCartIds.map((x: any) => NumberUtils.toNumber(x)).filter((x) => x > 0)
        : []

      const voucher = payload.voucher
      const userAddressId = NumberUtils.toNumber(payload.user_address_id, 0)

      const courierName = String(payload.shipping_service_type || '').trim()
      const courierService = String(payload.shipping_service || '').trim()

      const shippingPriceInput = normalizeInt(payload.shipping_price, 0)
      const isProtected = !!payload.is_protected
      const protectionFee = normalizeInt(payload.protection_fee, 0)

      const weightFromReq = normalizeInt(payload.weight, 0)
      const etd = String(payload.shipping_etd || payload.etd || '').trim() || null

      if (!cartIds.length) {
        const err: any = new Error('cart_ids wajib diisi')
        err.httpStatus = 400
        throw err
      }
      if (!userAddressId) {
        const err: any = new Error('user_address_id wajib diisi')
        err.httpStatus = 400
        throw err
      }
      if (!courierName || !courierService) {
        const err: any = new Error('shipping_service_type & shipping_service wajib diisi')
        err.httpStatus = 400
        throw err
      }
      if (shippingPriceInput <= 0) {
        const err: any = new Error('shipping_price wajib diisi dan harus > 0')
        err.httpStatus = 400
        throw err
      }

      const carts = await TransactionCart.query({ client: trx })
        .whereIn('id', cartIds)
        .where('user_id', user.id)
        .preload('product')
        .preload('variant')

      if (carts.length === 0) {
        const err: any = new Error('Cart not found or empty.')
        err.httpStatus = 400
        throw err
      }

      for (const c of carts as any[]) {
        const po = await ProductOnline.query({ client: trx })
          .where('product_id', c.productId)
          .where('is_active', true)
          .preload('product')
          .first()
        if (!po || !po.product) {
          const err: any = new Error('Product not available online')
          err.httpStatus = 400
          throw err
        }
      }

      const subTotal = carts.reduce((acc, cart: any) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        return acc + (NumberUtils.toNumber(cart.price) - NumberUtils.toNumber(cart.discount)) * qty
      }, 0)

      const userAddress = await UserAddress.query({ client: trx }).where('id', userAddressId).first()
      if (!userAddress) {
        const err: any = new Error('Address not found.')
        err.httpStatus = 400
        throw err
      }
      if (!userAddress.postalCode) {
        const err: any = new Error('Postal code not found. Please update your address.')
        err.httpStatus = 400
        throw err
      }

      const weightFromCart = carts.reduce((acc, cart: any) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        const vWeight = NumberUtils.toNumber(cart?.variant?.weight, 0)
        const pWeight = NumberUtils.toNumber(cart?.product?.weight, 0)
        const w = vWeight || pWeight || 0
        return acc + w * qty
      }, 0)

      const totalWeight = Math.max(1, weightFromReq || weightFromCart || 1)
      const shippingPrice = shippingPriceInput

      const discount = this.voucherCalc.calculateVoucher(voucher, subTotal, shippingPrice)
      const grandTotal =
        this.voucherCalc.generateGrandTotal(voucher, subTotal, shippingPrice) + (isProtected ? protectionFee : 0)

      const transaction = new Transaction()
      transaction.userId = user.id
      transaction.amount = grandTotal
      transaction.subTotal = subTotal
      transaction.grandTotal = grandTotal
      transaction.discount = discount
      transaction.discountType = NumberUtils.toNumber(voucher?.type, 0)
      transaction.transactionNumber = this.generateTransactionNumber()
      transaction.transactionStatus = TransactionStatus.WAITING_PAYMENT.toString()
      transaction.channel = 'ecommerce'
      await transaction.useTransaction(trx).save()

      const snap = await this.midtrans.createSnapTransaction(transaction.transactionNumber, transaction.grandTotal, user)

      const transactionEcommerce = new TransactionEcommerce()
      transactionEcommerce.transactionId = transaction.id
      transactionEcommerce.voucherId = voucher?.id ?? null
      transactionEcommerce.tokenMidtrans = snap.token
      transactionEcommerce.redirectUrl = snap.redirect_url
      transactionEcommerce.userId = user.id
      transactionEcommerce.shippingCost = shippingPrice
      transactionEcommerce.userAddressId = userAddressId
      transactionEcommerce.courierName = courierName
      transactionEcommerce.courierService = courierService
      await transactionEcommerce.useTransaction(trx).save()

      // 3) voucher reduce
      if (voucher?.id) {
        await this.voucherCalc.decrementVoucher(trx, voucher.id)
      }

      // 4) stock reduce + create details + delete cart
      await this.stock.reduceFromCarts(trx, carts, transaction.id)

      // 5) shipment
      const areaName = String((userAddress as any).biteshipAreaName || '').trim()
      const postal = String(userAddress.postalCode || '').trim()
      const addrText = [userAddress.address, areaName, postal].filter(Boolean).join(', ')

      const shipment = new TransactionShipment()
      shipment.transactionId = transaction.id
      shipment.service = courierName
      shipment.serviceType = courierService
      shipment.price = shippingPrice
      shipment.address = addrText

      shipment.provinceId = (userAddress as any).province ?? null
      shipment.cityId = (userAddress as any).city ?? null
      shipment.districtId = (userAddress as any).district ?? null
      shipment.subdistrictId = (userAddress as any).subDistrict ?? null

      shipment.postalCode = postal || ''
      shipment.pic = userAddress.picName || ''
      shipment.pic_phone = userAddress.picPhone || ''

      shipment.estimationArrival = etd
      ;(shipment as any).isProtected = isProtected ? 1 : 0
      shipment.protectionFee = isProtected ? protectionFee : 0

      await shipment.useTransaction(trx).save()

      return {
        transaction,
        ecommerce: transactionEcommerce,
        shipment,
        meta: { totalWeight },
      }
    })
  }
}
