import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import TransactionEcommerce from '#models/transaction_ecommerce'
import TransactionDetail from '#models/transaction_detail'
import TransactionShipment from '#models/transaction_shipment'
import TransactionCart from '#models/transaction_cart'
import Voucher from '#models/voucher'
import ProductVariant from '#models/product_variant'
import Product from '#models/product'
import UserAddress from '#models/user_address'
import axios from 'axios'
import env from '#start/env'
import { TransactionStatus } from '../../enums/transaction_status.js'
import { createHash } from 'node:crypto'
import BiteshipService from '#services/biteship_service'

function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toSortDir(v: any): 'asc' | 'desc' {
  const s = String(v || '').toLowerCase()
  return s === 'asc' ? 'asc' : 'desc'
}

function normalizeInt(v: any, fallback = 0) {
  const n = toNumber(v, fallback)
  return Math.max(0, Math.round(n))
}

function pickReceiptFromMidtrans(payload: any) {
  return (
    payload?.transaction_id ||
    payload?.va_numbers?.[0]?.va_number ||
    payload?.permata_va_number ||
    payload?.bill_key ||
    payload?.biller_code ||
    null
  )
}

function normalizeMidtransStatus(v: any) {
  return String(v || '').trim().toLowerCase()
}

function isBiteshipDelivered(status: any) {
  const s = String(status || '').toLowerCase()
  return s.includes('delivered') || s.includes('completed') || s.includes('selesai') || s.includes('success')
}

function isBiteshipFailed(status: any) {
  const s = String(status || '').toLowerCase()
  return s.includes('cancel') || s.includes('failed') || s.includes('return')
}

function isBiteshipInTransit(status: any) {
  const s = String(status || '').toLowerCase()
  return (
    s.includes('in_transit') ||
    s.includes('out_for_delivery') ||
    s.includes('on_delivery') ||
    s.includes('picked') ||
    s.includes('pickup') ||
    s.includes('dropped') ||
    s.includes('shipping')
  )
}

export default class TransactionEcommerceController {
  private async restoreStockAndVoucher(trx: any, transactionId: number, voucherId: number | null) {
    const details = await TransactionDetail.query({ client: trx }).where('transaction_id', transactionId)

    for (const d of details as any[]) {
      if (d.productVariantId) {
        const pv = await ProductVariant.query({ client: trx }).where('id', d.productVariantId).forUpdate().first()
        if (pv) {
          pv.stock = toNumber(pv.stock) + toNumber(d.qty)
          await pv.useTransaction(trx).save()
        }
      }

      if (d.productId) {
        const p = await Product.query({ client: trx }).where('id', d.productId).forUpdate().first()
        if (p) {
          p.popularity = Math.max(0, toNumber(p.popularity) - 1)
          await p.useTransaction(trx).save()
        }
      }
    }

    if (voucherId) {
      const v = await Voucher.query({ client: trx }).where('id', voucherId).forUpdate().first()
      if (v) {
        v.qty = toNumber(v.qty) + 1
        await v.useTransaction(trx).save()
      }
    }
  }

  public async get({ response, request, auth }: HttpContext) {
    try {
      const q = request.qs()
      const page = toNumber(q.page, 1) || 1
      const perPage = toNumber(q.per_page, 10) || 10

      const allowedSort = new Set(['created_at', 'updated_at', 'id', 'shipping_cost', 'user_address_id'])
      const sortBy = allowedSort.has(String(q.field)) ? String(q.field) : 'created_at'
      const sortDir = toSortDir(q.value)

      const transactionNumber = q.transaction_number ?? ''
      const status = q.status ?? ''
      const startDate = q.start_date ?? ''
      const endDate = q.end_date ?? ''

      const dataTransaction = await TransactionEcommerce.query()
        .whereHas('transaction', (trxQuery) => {
          trxQuery.where('user_id', auth.user?.id ?? 0)

          if (transactionNumber) trxQuery.where('transaction_number', transactionNumber)
          if (status) trxQuery.where('transaction_status', status)
          if (startDate) trxQuery.where('created_at', '>=', startDate)
          if (endDate) trxQuery.where('created_at', '<=', endDate)
        })
        .preload('transaction', (trxLoader) => {
          trxLoader.preload('details', (detailLoader) => {
            detailLoader.preload('product', (productLoader) => {
              productLoader.preload('medias')
            })
          })
        })
        .preload('shipments')
        .orderBy(sortBy, sortDir)
        .paginate(page, perPage)

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataTransaction.toJSON().data,
          ...dataTransaction.toJSON().meta,
        },
      })
    } catch (error: any) {
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user
      if (!user) {
        await trx.rollback()
        return response.status(401).send({ message: 'Unauthorized', serve: null })
      }

      const rawCartIds = request.input('cart_ids') ?? []
      const cartIds: number[] = Array.isArray(rawCartIds)
        ? rawCartIds.map((x) => toNumber(x)).filter((x) => x > 0)
        : []

      const voucher = request.input('voucher')
      const userAddressId = toNumber(request.input('user_address_id'), 0)

      const courierName = String(request.input('shipping_service_type') || '').trim() // contoh: jne / sicepat
      const courierService = String(request.input('shipping_service') || '').trim() // contoh: REG / BEST / OKE

      const shippingPriceInput = normalizeInt(request.input('shipping_price'), 0)
      const isProtected = !!request.input('is_protected')
      const protectionFee = normalizeInt(request.input('protection_fee'), 0)

      const weightFromReq = normalizeInt(request.input('weight'), 0)

      const etd = String(request.input('shipping_etd') || request.input('etd') || '').trim() || null

      if (!cartIds.length) {
        await trx.rollback()
        return response.status(400).send({ message: 'cart_ids wajib diisi', serve: null })
      }

      if (!userAddressId) {
        await trx.rollback()
        return response.status(400).send({ message: 'user_address_id wajib diisi', serve: null })
      }

      if (!courierName || !courierService) {
        await trx.rollback()
        return response.status(400).send({
          message: 'shipping_service_type & shipping_service wajib diisi',
          serve: null,
        })
      }

      if (shippingPriceInput <= 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'shipping_price wajib diisi dan harus > 0',
          serve: null,
        })
      }

      const carts = await TransactionCart.query({ client: trx })
        .whereIn('id', cartIds)
        .where('user_id', user.id)
        .preload('product')
        .preload('variant')

      if (carts.length === 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Cart not found or empty.',
          serve: [],
        })
      }

      const subTotal = carts.reduce((acc, cart: any) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        return acc + (toNumber(cart.price) - toNumber(cart.discount)) * qty
      }, 0)

      const userAddress = await UserAddress.query({ client: trx }).where('id', userAddressId).first()
      if (!userAddress) {
        await trx.rollback()
        return response.status(400).send({ message: 'Address not found.', serve: [] })
      }

      if (!userAddress.postalCode) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Postal code not found. Please update your address.',
          serve: [],
        })
      }

      const weightFromCart = carts.reduce((acc, cart: any) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        const vWeight = toNumber(cart?.variant?.weight, 0)
        const pWeight = toNumber(cart?.product?.weight, 0)
        const w = vWeight || pWeight || 0
        return acc + w * qty
      }, 0)

      const totalWeight = Math.max(1, weightFromReq || weightFromCart || 1)

      const shippingPrice = shippingPriceInput

      const discount = this.calculateVoucher(voucher, subTotal, shippingPrice)
      const grandTotal = this.generateGrandTotal(voucher, subTotal, shippingPrice) + (isProtected ? protectionFee : 0)

      const transaction = new Transaction()
      transaction.userId = user.id
      transaction.amount = grandTotal
      transaction.subTotal = subTotal
      transaction.grandTotal = grandTotal
      transaction.discount = discount
      transaction.discountType = toNumber(voucher?.type, 0)
      transaction.transactionNumber = this.generateTransactionNumber()
      transaction.transactionStatus = TransactionStatus.WAITING_PAYMENT.toString()
      transaction.channel = 'ecommerce'
      await transaction.useTransaction(trx).save()

      const parameter = {
        transaction_details: {
          order_id: transaction.transactionNumber,
          gross_amount: transaction.grandTotal,
        },
        customer_details: {
          first_name: user.firstName || user.email,
          last_name: user.lastName || '',
          email: user.email,
          phone: user.phoneNumber || '',
        },
      }

      const serverKey = env.get('MIDTRANS_SERVER_KEY')
      const authString = Buffer.from(serverKey + ':').toString('base64')

      const snapUrl =
        env.get('MIDTRANS_ENV') === 'production'
          ? 'https://app.midtrans.com/snap/v1/transactions'
          : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

      const { data: snap } = await axios.post(snapUrl, parameter, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${authString}`,
        },
      })

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

      // ========= voucher reduce =========
      if (voucher?.id) {
        const voucherDb = await Voucher.query({ client: trx }).where('id', voucher.id).first()
        if (voucherDb) {
          voucherDb.qty = Math.max(0, toNumber(voucherDb.qty) - 1)
          await voucherDb.useTransaction(trx).save()
        }
      }

      // ========= stock reduce + details + delete cart =========
      for (const cart of carts as any[]) {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        if (!cart.productVariantId) continue

        const productVariant = await ProductVariant.query({ client: trx })
          .preload('product')
          .where('id', cart.productVariantId)
          .forUpdate()
          .first()

        if (!productVariant) {
          await trx.rollback()
          return response.status(400).send({ message: 'Variant not found', serve: [] })
        }

        if (productVariant.stock < qty) {
          await trx.rollback()
          return response.status(400).send({
            message: `Stock not enough for ${productVariant.product?.name || 'product'}`,
            serve: [],
          })
        }

        productVariant.stock = productVariant.stock - qty
        await productVariant.useTransaction(trx).save()

        const transactionDetail = new TransactionDetail()
        transactionDetail.qty = qty
        transactionDetail.price = toNumber(cart.price)
        transactionDetail.amount = ((toNumber(cart.price) - toNumber(cart.discount)) * qty).toString()
        transactionDetail.discount = toNumber(cart.discount)
        transactionDetail.attributes = cart.attributes ?? ''
        transactionDetail.transactionId = transaction.id
        transactionDetail.productId = cart.productId ?? 0
        transactionDetail.productVariantId = cart.productVariantId
        await transactionDetail.useTransaction(trx).save()

        if (cart.productId) {
          const product = await Product.query({ client: trx }).where('id', cart.productId).first()
          if (product) {
            product.popularity = toNumber(product.popularity) + 1
            await product.useTransaction(trx).save()
          }
        }

        await cart.useTransaction(trx).delete()
      }

      // ========= shipment (Biteship address fields) =========
      const areaName = String((userAddress as any).biteshipAreaName || '').trim()
      const postal = String(userAddress.postalCode || '').trim()
      const addrText = [userAddress.address, areaName, postal].filter(Boolean).join(', ')

      const transactionShipment = new TransactionShipment()
      transactionShipment.transactionId = transaction.id
      transactionShipment.service = courierName
      transactionShipment.serviceType = courierService
      transactionShipment.price = shippingPrice
      transactionShipment.address = addrText

      // legacy ids -> null (karena sekarang pakai biteship area)
      transactionShipment.provinceId = (userAddress as any).province ?? null
      transactionShipment.cityId = (userAddress as any).city ?? null
      transactionShipment.districtId = (userAddress as any).district ?? null
      transactionShipment.subdistrictId = (userAddress as any).subDistrict ?? null

      transactionShipment.postalCode = postal || ''
      transactionShipment.pic = userAddress.picName || ''
      transactionShipment.pic_phone = userAddress.picPhone || ''

      transactionShipment.estimationArrival = etd
      ;(transactionShipment as any).isProtected = isProtected ? 1 : 0
      transactionShipment.protectionFee = isProtected ? protectionFee : 0

      await transactionShipment.useTransaction(trx).save()

      await trx.commit()

      return response.status(200).send({
        message: 'Transaction created successfully.',
        serve: {
          ...transaction.toJSON(),
          ecommerce: transactionEcommerce.toJSON(),
          shipment: transactionShipment.toJSON(),
          meta: { totalWeight },
        },
      })
    } catch (e: any) {
      console.log(e?.response?.data || e)
      await trx.rollback()
      return response.status(500).send({
        message: e?.response?.data?.message || e.message || 'Internal Server Error',
        serve: e?.response?.data || null,
      })
    }
  }

  private calculateVoucher(v: any, subTotal: number, shippingPrice: number) {
    if (!v) return 0

    const isPercentage = toNumber(v.isPercentage) === 1
    const type = toNumber(v.type)
    const percentage = toNumber(v.percentage)
    const maxDiscPrice = toNumber(v.maxDiscPrice)
    const fixedPrice = toNumber(v.price)

    if (isPercentage) {
      if (type === 2) {
        const disc = Math.floor(shippingPrice * (percentage / 100))
        return Math.min(disc, maxDiscPrice || disc, shippingPrice)
      }
      const disc = Math.floor(subTotal * (percentage / 100))
      return Math.min(disc, maxDiscPrice || disc)
    }

    if (type === 2) return Math.min(fixedPrice, shippingPrice)
    return fixedPrice
  }

  private generateGrandTotal(v: any, subTotal: number, shippingPrice: number) {
    return subTotal + shippingPrice - (this.calculateVoucher(v, subTotal, shippingPrice) || 0)
  }

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

  public async webhookMidtrans({ request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const orderId = String(request.input('order_id') || '')
      const statusCode = String(request.input('status_code') || '')
      const grossAmount = String(request.input('gross_amount') || '')
      const signatureKey = String(request.input('signature_key') || '')

      const serverKey = env.get('MIDTRANS_SERVER_KEY')
      const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
      const expected = createHash('sha512').update(raw).digest('hex')

      if (signatureKey && signatureKey !== expected) {
        await trx.rollback()
        return response.status(401).json({ message: 'Invalid signature', serve: [] })
      }

      const transaction = await Transaction.query({ client: trx }).where('transaction_number', orderId).first()
      if (!transaction) {
        await trx.commit()
        return response.status(400).json({ message: 'Order not valid.', serve: [] })
      }

      const transactionEcommerce = await TransactionEcommerce.query({ client: trx })
        .where('transaction_id', transaction.id)
        .first()

      const transactionStatus = normalizeMidtransStatus(request.input('transaction_status'))
      const fraudStatus = normalizeMidtransStatus(request.input('fraud_status'))

      if (transactionEcommerce) {
        transactionEcommerce.paymentMethod = request.input('payment_type') || null
        transactionEcommerce.receipt = pickReceiptFromMidtrans(request.all()) || null
        await transactionEcommerce.useTransaction(trx).save()
      }

      const current = String(transaction.transactionStatus || '')

      // ✅ terminal: FAILED jangan diubah lagi (biar stok/voucher gak kacau)
      if (current === TransactionStatus.FAILED.toString()) {
        await trx.commit()
        return response.status(200).json({ message: 'ok', serve: [] })
      }

      const isFinal =
        current === TransactionStatus.ON_PROCESS.toString() ||
        current === TransactionStatus.ON_DELIVERY.toString() ||
        current === TransactionStatus.COMPLETED.toString()

      let nextStatus: string | null = null
      if (transactionStatus === 'capture' && fraudStatus === 'accept') {
        nextStatus = TransactionStatus.PAID_WAITING_ADMIN.toString()
      } else if (transactionStatus === 'settlement') {
        nextStatus = TransactionStatus.PAID_WAITING_ADMIN.toString()
      } else if (transactionStatus === 'pending') {
        nextStatus = TransactionStatus.WAITING_PAYMENT.toString()
      } else if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus)) {
        nextStatus = TransactionStatus.FAILED.toString()
      }

      // ✅ jangan downgrade paid -> waiting
      const isDowngrade =
        current === TransactionStatus.PAID_WAITING_ADMIN.toString() &&
        nextStatus === TransactionStatus.WAITING_PAYMENT.toString()

      const prevStatus = current
      let changed = false

      // ✅ guard: kalau sudah final, jangan override status apa pun
      if (nextStatus && !isFinal && !isDowngrade && prevStatus !== nextStatus) {
        transaction.transactionStatus = nextStatus
        await transaction.useTransaction(trx).save()
        changed = true
      }

      // ✅ kalau berubah jadi FAILED, restore stock + voucher sekali
      if (
        changed &&
        nextStatus === TransactionStatus.FAILED.toString() &&
        prevStatus !== TransactionStatus.FAILED.toString()
      ) {
        const voucherId = transactionEcommerce?.voucherId ?? null
        await this.restoreStockAndVoucher(trx, transaction.id, voucherId)
      }

      await trx.commit()
      return response.status(200).json({ message: 'ok', serve: [] })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).json({ message: error.message, serve: [] })
    }
  }

  /**
   * ✅ RETRIEVE TRANSACTION DETAIL
   * + auto sync status dari Biteship (kalau ada resi & courier)
   */
  public async getByTransactionNumber({ response, request }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')

      const dataTransaction = await TransactionEcommerce.query()
        .whereHas('transaction', (trxQuery) => {
          trxQuery.where('transaction_number', transactionNumber)
        })
        .preload('transaction', (trxLoader) => {
          trxLoader
            .preload('details', (query) => {
              query.preload('product', (productLoader) => {
                productLoader.preload('medias').preload('categoryType')
              })
            })
            .preload('shipments')
        })
        .preload('shipments')
        .preload('userAddress')
        .preload('user')
        .first()

      if (!dataTransaction) {
        return response.status(400).send({
          message: 'Transaction not found.',
          serve: [],
        })
      }

      // =========================
      // ✅ SYNC STATUS DARI BITESHIP
      // =========================
      try {
        const trxModel: any = dataTransaction.transaction
        const current = String(trxModel?.transactionStatus || '')

        const trxShipments = Array.isArray(trxModel?.shipments) ? trxModel.shipments : []
        const ecoShipments = Array.isArray((dataTransaction as any)?.shipments) ? (dataTransaction as any).shipments : []
        const shipment: any = trxShipments[0] || ecoShipments[0] || null

        const isFinal =
          current === TransactionStatus.COMPLETED.toString() || current === TransactionStatus.FAILED.toString()

        if (!isFinal && shipment?.resiNumber && shipment?.service) {
          const waybillId = String(shipment.resiNumber).trim()
          const courierCode = String(shipment.service).trim().toLowerCase()

          const tracking = await BiteshipService.retrievePublicTracking(waybillId, courierCode)

          if (tracking?.success && tracking?.status) {
            const bsStatus = String(tracking.status)

            // simpan status tracking ke shipment.status
            shipment.status = bsStatus
            await shipment.save()

            // update transaksi sesuai status biteship
            if (isBiteshipDelivered(bsStatus)) {
              trxModel.transactionStatus = TransactionStatus.COMPLETED.toString()
              await trxModel.save()
            } else if (isBiteshipFailed(bsStatus)) {
              trxModel.transactionStatus = TransactionStatus.FAILED.toString()
              await trxModel.save()
            } else if (current === TransactionStatus.ON_PROCESS.toString() && isBiteshipInTransit(bsStatus)) {
              trxModel.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
              await trxModel.save()
            }
          }
        }
      } catch (e: any) {
        console.log('Biteship sync error:', e?.response?.data || e?.message || e)
      }

      // RajaOngkir/Komerce removed => waybill lookup disabled (return null)
      const waybill = null

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataTransaction,
          waybill,
        },
      })
    } catch (error: any) {
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  /**
   * ✅ User confirm selesai (harus sudah dikirim dulu)
   */
  public async confirmOrder({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const transactionNumber = request.input('transaction_number')

      const transaction = await Transaction.query({ client: trx })
        .where('transaction_number', transactionNumber)
        .where('user_id', auth.user?.id ?? 0)
        .preload('shipments')
        .first()

      if (!transaction) {
        await trx.rollback()
        return response.status(404).send({
          message: 'Transaction not found.',
          serve: [],
        })
      }

      // ✅ prevent user selesaiin sebelum dikirim
      if (transaction.transactionStatus !== TransactionStatus.ON_DELIVERY.toString()) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Pesanan belum dikirim, belum bisa dikonfirmasi selesai.',
          serve: [],
        })
      }

      transaction.transactionStatus = TransactionStatus.COMPLETED.toString()
      await transaction.useTransaction(trx).save()

      if (transaction.shipments.length > 0) {
        const shipment = transaction.shipments[0]
        shipment.status = 'Delivered'
        await shipment.useTransaction(trx).save()
      }

      await trx.commit()

      return response.status(200).send({
        message: 'Transaction marked as completed.',
        serve: transaction,
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  /**
   * RajaOngkir/Komerce pickup removed.
   * Kalau mau pickup, integrasikan ke Biteship order/pickup flow nanti.
   */
  public async requestPickup({ request, response }: HttpContext) {
    return response.status(501).send({
      message: 'Pickup request is not implemented (RajaOngkir/Komerce removed).',
      serve: null,
    })
  }

  public async updateWaybillStatus({ request, response }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const newStatus = request.input('status')

      const transaction = await Transaction.query()
        .where('transaction_number', transactionNumber)
        .preload('shipments')
        .first()

      if (!transaction || transaction.shipments.length === 0) {
        return response.status(404).send({
          message: 'Transaction or shipment not found',
          serve: [],
        })
      }

      const shipment = transaction.shipments[0]
      shipment.status = newStatus
      await shipment.save()

      return response.status(200).send({
        message: 'Waybill status updated',
        serve: shipment,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }
}
