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
import qs from 'qs'
import PickupService from '#services/pickup_service'
import { createHash } from 'node:crypto'

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

function pickEtdFromKomerceRows(rows: any[], courierService: string) {
  if (!Array.isArray(rows) || rows.length === 0) return null

  const want = String(courierService || '').trim().toLowerCase()
  if (!want) return rows[0]?.etd ?? null

  // Komerce kadang beda-beda key, coba beberapa kemungkinan
  const matched =
    rows.find((r) => String(r?.service || '').toLowerCase() === want) ||
    rows.find((r) => String(r?.service_name || '').toLowerCase() === want) ||
    rows.find((r) => String(r?.courier_service || '').toLowerCase() === want) ||
    rows.find((r) => String(r?.service_code || '').toLowerCase() === want) ||
    rows.find((r) => String(r?.serviceType || '').toLowerCase() === want)

  return (matched?.etd ?? rows[0]?.etd ?? null) as any
}

export default class TransactionEcommerceController {
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

      // ========= payload =========
      const rawCartIds = request.input('cart_ids') ?? []
      const cartIds: number[] = Array.isArray(rawCartIds)
        ? rawCartIds.map((x) => toNumber(x)).filter((x) => x > 0)
        : []

      const voucher = request.input('voucher') // bisa null / object
      const userAddressId = toNumber(request.input('user_address_id'), 0)

      // di FE kamu: shipping_service_type = courier (jne/tiki/dll), shipping_service = REG/ECO/dll
      const courierName = String(request.input('shipping_service_type') || '').trim()
      const courierService = String(request.input('shipping_service') || '').trim()

      const shippingPriceInput = normalizeInt(request.input('shipping_price'), 0)
      const isProtected = !!request.input('is_protected')
      const protectionFee = normalizeInt(request.input('protection_fee'), 0)

      // optional: FE bisa kirim weight
      const weightFromReq = normalizeInt(request.input('weight'), 0)

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

      // ========= carts =========
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

      const subTotal = carts.reduce((acc, cart) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        return acc + (toNumber(cart.price) - toNumber(cart.discount)) * qty
      }, 0)

      // ========= address =========
      const userAddress = await UserAddress.query({ client: trx }).where('id', userAddressId).first()
      if (!userAddress) {
        await trx.rollback()
        return response.status(400).send({ message: 'Address not found.', serve: [] })
      }
      if (!userAddress.postalCode) {
        await trx.rollback()
        return response
          .status(400)
          .send({ message: 'Postal code not found. Please update your address.', serve: [] })
      }

      // ========= weight =========
      // Prioritas: request.weight -> hitung dari cart (variant.weight/product.weight)
      const weightFromCart = carts.reduce((acc, cart: any) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        const vWeight = toNumber(cart?.variant?.weight, 0)
        const pWeight = toNumber(cart?.product?.weight, 0)
        const w = vWeight || pWeight || 0
        return acc + w * qty
      }, 0)

      // minimal 1 gram biar API gak error
      const totalWeight = Math.max(1, weightFromReq || weightFromCart || 1)

      // ========= komerce etd + (optional) price sanity =========
      const komerceClient = axios.create({
        baseURL: env.get('KOMERCE_COST_BASE_URL'),
        headers: { key: env.get('KOMERCE_COST_API_KEY') },
      })

      const origin = normalizeInt(env.get('KOMERCE_ORIGIN'), 0)
      const originType = String(env.get('KOMERCE_ORIGIN_TYPE') || 'district')

      const destinationSubdistrict = normalizeInt(userAddress.subDistrict, 0)
      if (!destinationSubdistrict) {
        await trx.rollback()
        return response
          .status(400)
          .send({ message: 'Subdistrict not found. Please update your address.', serve: [] })
      }

      const komerceBody = qs.stringify({
        origin,
        originType,
        destination: destinationSubdistrict,
        destinationType: 'subdistrict',
        weight: totalWeight,
        courier: courierName, // satu courier saja (untuk verifikasi service/etd)
        price: 'lowest',
      })

      const { data: komerceResp } = await komerceClient.post('/calculate/district/domestic-cost', komerceBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      })

      if (!komerceResp?.data || !Array.isArray(komerceResp.data) || komerceResp.data.length === 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Shipping service not available for this destination.',
          serve: [],
        })
      }

      const etd = pickEtdFromKomerceRows(komerceResp.data, courierService)

      // kalau mau super aman: bisa validasi shippingPriceInput vs hasil API (optional)
      // untuk sekarang kita tetap pakai input FE biar alur kamu gak pecah
      const shippingPrice = shippingPriceInput

      const discount = this.calculateVoucher(voucher, subTotal, shippingPrice)
      const grandTotal = this.generateGrandTotal(voucher, subTotal, shippingPrice) + (isProtected ? protectionFee : 0)

      // ========= transaction =========
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

      // ========= MIDTRANS SNAP =========
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

      // ========= ecommerce record =========
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

      // ========= voucher reduce (opsional) =========
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

      // ========= shipment =========
      const transactionShipment = new TransactionShipment()
      transactionShipment.transactionId = transaction.id
      transactionShipment.service = courierName
      transactionShipment.serviceType = courierService
      transactionShipment.price = shippingPrice
      transactionShipment.address = `${userAddress.address}, ${userAddress.subDistrict}, ${userAddress.district}, ${userAddress.city}, ${userAddress.province}, ${userAddress.postalCode}`
      transactionShipment.provinceId = userAddress.province
      transactionShipment.cityId = userAddress.city
      transactionShipment.districtId = userAddress.district
      transactionShipment.subdistrictId = userAddress.subDistrict
      transactionShipment.postalCode = userAddress.postalCode
      transactionShipment.pic = userAddress.picName
      transactionShipment.pic_phone = userAddress.picPhone
      transactionShipment.estimationArrival = etd
      transactionShipment.protectionFee = protectionFee
      await transactionShipment.useTransaction(trx).save()

      await trx.commit()

      return response.status(200).send({
        message: 'Transaction created successfully.',
        serve: {
          ...transaction.toJSON(),
          ecommerce: transactionEcommerce.toJSON(),
          shipment: transactionShipment.toJSON(),
        },
      })
    } catch (e: any) {
      console.log(e)
      await trx.rollback()
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  private calculateVoucher(v: any, subTotal: number, shippingPrice: number) {
    if (!v) return 0

    const isPercentage = toNumber(v.isPercentage) === 1
    const type = toNumber(v.type) // 2 = shipping?
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
      const orderId = request.input('order_id')
      const statusCode = request.input('status_code')
      const grossAmount = request.input('gross_amount')
      const signatureKey = request.input('signature_key')

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

      const transactionStatus = request.input('transaction_status')
      const fraudStatus = request.input('fraud_status')

      if (transactionEcommerce) {
        transactionEcommerce.paymentMethod = request.input('payment_type') || null
        transactionEcommerce.receipt =
          request.input('transaction_id') || request.input('va_numbers')?.[0]?.va_number || null
        await transactionEcommerce.useTransaction(trx).save()
      }

      if (transactionStatus === 'capture' && fraudStatus === 'accept') {
        transaction.transactionStatus = TransactionStatus.ON_PROCESS.toString()
      } else if (transactionStatus === 'settlement') {
        transaction.transactionStatus = TransactionStatus.ON_PROCESS.toString()
      } else if (transactionStatus === 'pending') {
        transaction.transactionStatus = TransactionStatus.WAITING_PAYMENT.toString()
      } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
        transaction.transactionStatus = TransactionStatus.FAILED.toString()
      }

      await transaction.useTransaction(trx).save()
      await trx.commit()

      return response.status(200).json({ message: 'ok', serve: [] })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).json({ message: error.message, serve: [] })
    }
  }

  public async getByTransactionNumber({ response, request }: HttpContext) {
    try {
      const dataTransaction = await TransactionEcommerce.query()
        .whereHas('transaction', (trxQuery) => {
          trxQuery.where('transaction_number', request.input('transaction_number'))
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
        .first()

      if (!dataTransaction) {
        return response.status(400).send({
          message: 'Transaction not found.',
          serve: [],
        })
      }

      let waybill = null
      const firstShipment = dataTransaction.transaction?.shipments?.[0]

      if (firstShipment?.resiNumber) {
        try {
          const client = axios.create({
            baseURL: env.get('KOMERCE_DELIVERY_BASE_URL'),
            headers: {
              'x-api-key': env.get('KOMERCE_DELIVERY_API_KEY'),
              'Content-Type': 'application/json',
            },
          })

          const res = await client.get(`/order/api/v1/orders/detail?order_no=${firstShipment.resiNumber}`)
          waybill = res.data?.data ?? null

          if (waybill && waybill.order_status === 'Diajukan' && firstShipment.status) {
            waybill.order_status = firstShipment.status
          }
        } catch (error: any) {
          console.log('Error fetching waybill:', error.response?.data || error.message)
          waybill = null
        }
      }

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

  public async requestPickup({ request, response }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const pickupDate = request.input('pickup_date')
      const pickupTime = request.input('pickup_time')
      const pickupVehicle = request.input('pickup_vehicle')

      const transaction = await Transaction.query().where('transaction_number', transactionNumber).preload('shipments').first()

      if (!transaction || transaction.shipments.length === 0) {
        return response.status(400).send({
          message: 'Transaction or shipment not found',
          serve: [],
        })
      }

      const shipment = transaction.shipments[0]
      if (!shipment.resiNumber) {
        return response.status(400).send({
          message: 'Resi number not found, cannot request pickup',
          serve: [],
        })
      }

      const pickupService = new PickupService()
      const data = await pickupService.requestPickup(shipment.resiNumber, pickupDate, pickupTime, pickupVehicle)

      return response.status(200).send({
        message: 'Pickup request processed',
        serve: data,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Pickup request failed',
        serve: [],
      })
    }
  }

  public async updateWaybillStatus({ request, response }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const newStatus = request.input('status')

      const transaction = await Transaction.query().where('transaction_number', transactionNumber).preload('shipments').first()

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
