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

export default class TransactionEcommerceController {
  // =========================
  // GET MY TRANSACTIONS
  // =========================
  public async get({ response, request, auth }: HttpContext) {
    try {
      const queryString = request.qs()
      const sortBy = queryString.field || 'created_at'
      const sortType = (queryString.value || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      const transactionNumber = queryString.transaction_number ?? ''
      const status = queryString.status ?? ''
      const startDate = queryString.start_date ?? ''
      const endDate = queryString.end_date ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataTransaction = await TransactionEcommerce.query()
        .whereHas('transaction', (trxQuery) => {
          trxQuery.where('user_id', auth.user?.id ?? 0)

          if (transactionNumber) trxQuery.where('transaction_number', transactionNumber)
          if (status) trxQuery.where('transaction_status', status) // ✅ FIX (bukan "status")
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
        .orderBy(sortBy, sortType)
        .paginate(page, per_page)

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataTransaction?.toJSON().data,
          ...dataTransaction.toJSON().meta,
        },
      })
    } catch (error) {
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  // =========================
  // CREATE CHECKOUT + SNAP TOKEN
  // =========================
  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()

    // helper status (biar gak error kalau enum kamu beda)
    const S: any = TransactionStatus as any
    const STATUS_WAITING = (S.WAITING_PAYMENT ?? S.PENDING ?? S.WAITING ?? 'WAITING_PAYMENT').toString()

    try {
      const userId = auth.user?.id ?? 0
      if (!userId) {
        await trx.rollback()
        return response.status(401).send({ message: 'Unauthorized', serve: null })
      }

      const cartIdsRaw = request.input('cart_ids') || []
      const cartIds = Array.isArray(cartIdsRaw)
        ? cartIdsRaw.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n) && n > 0)
        : []

      if (cartIds.length === 0) {
        await trx.rollback()
        return response.status(400).send({ message: 'cart_ids is required.', serve: [] })
      }

      const isProtected = request.input('is_protected') ? 1 : 0
      const protectionFee = this.toInt(request.input('protection_fee') || '0')

      const userAddressId = Number(request.input('user_address_id') || 0)
      const courierName = request.input('shipping_service_type')
      const courierService = request.input('shipping_service')

      if (!userAddressId) {
        await trx.rollback()
        return response.status(400).send({ message: 'user_address_id is required.', serve: [] })
      }
      if (!courierName) {
        await trx.rollback()
        return response.status(400).send({ message: 'shipping_service_type is required.', serve: [] })
      }

      // ✅ carts (LOCKED by trx context)
      const carts = await TransactionCart.query({ client: trx })
        .whereIn('id', cartIds)
        .where('user_id', userId)
        .preload('product')
        .preload('variant')

      if (carts.length === 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Cart not found or empty.',
          serve: [],
        })
      }

      // ✅ address
      const userAddress = await UserAddress.query({ client: trx })
        .where('id', userAddressId)
        .first()

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

      // ✅ subtotal + weight
      const subTotal = carts.reduce((acc, cart) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        return acc + (Number(cart.price) - Number(cart.discount || 0)) * qty
      }, 0)

      const totalWeight = carts.reduce((acc, cart) => {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        const w = Number(cart.product?.weight || 0)
        return acc + Math.max(0, w) * qty
      }, 0)

      const weightForKomerce = Math.max(1, Math.round(totalWeight || 1000))

      // ✅ shipping cost server-side (Komerce)
      const komerceClient = axios.create({
        baseURL: env.get('KOMERCE_COST_BASE_URL'),
        headers: { key: env.get('KOMERCE_COST_API_KEY') },
      })

      const body = qs.stringify({
        origin: Number(env.get('KOMERCE_ORIGIN')),
        originType: env.get('KOMERCE_ORIGIN_TYPE'),
        destination: userAddress.subDistrict,
        destinationType: 'subdistrict',
        weight: weightForKomerce,
        courier: courierName,
        price: 'lowest',
      })

      const { data: komerceResp } = await komerceClient.post('/calculate/district/domestic-cost', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      })

      const komerceOptions = Array.isArray(komerceResp?.data) ? komerceResp.data : []
      if (komerceOptions.length === 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Shipping cost not found. Please check address/courier.',
          serve: [],
        })
      }

      // ambil opsi pertama (lowest). kalau kamu nanti mau support pilih service, tinggal match di sini.
      const selectedOption = komerceOptions[0]
      const shippingCost = this.toInt(
        selectedOption?.cost?.value ??
          selectedOption?.cost ??
          selectedOption?.price ??
          selectedOption?.value ??
          selectedOption?.shipping_cost ??
          0
      )
      const shippingPrice = shippingCost.toString()
      const etd = selectedOption?.etd || null

      // ✅ voucher: ambil dari DB (jangan percaya object dari FE)
      const voucherInput = request.input('voucher')
      const voucherId = Number(request.input('voucher_id') || voucherInput?.id || 0)

      let voucherDb: any = null
      if (voucherId) {
        const v = await Voucher.query({ client: trx }).where('id', voucherId).first()
        if (v && Number(v.qty || 0) > 0) voucherDb = v
      }

      const discount = this.calculateVoucher(voucherDb, subTotal.toString(), shippingPrice)
      const grandTotal = this.generateGrandTotal(voucherDb, subTotal.toString(), shippingPrice)
      const amount = grandTotal + (isProtected ? protectionFee : 0)

      // ✅ create transaction
      const transaction = new Transaction()
      transaction.amount = amount
      transaction.discount = discount
      transaction.discountType = voucherDb?.type ?? 0
      transaction.subTotal = subTotal
      ;(transaction as any).userId = userId // ✅ FIX (bukan transaction.id)
      transaction.transactionNumber = this.generateTransactionNumber()
      transaction.channel = 'ecommerce'
      ;(transaction as any).transactionStatus = STATUS_WAITING
      await transaction.useTransaction(trx).save()

      // ✅ Midtrans SNAP
      const parameter = {
        transaction_details: {
          order_id: transaction.transactionNumber,
          gross_amount: transaction.amount,
        },
        customer_details: {
          first_name: auth.user?.firstName || auth.user?.name || 'Customer',
          last_name: auth.user?.lastName || auth.user?.name || 'Customer',
          email: auth.user?.email,
        },
      }

      const serverKey = env.get('MIDTRANS_SERVER_KEY')
      const authString = Buffer.from(serverKey + ':').toString('base64')

      const { data: snap } = await axios.post(
        env.get('MIDTRANS_ENV') === 'production'
          ? 'https://app.midtrans.com/snap/v1/transactions'
          : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
        parameter,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`,
          },
        }
      )

      // ✅ ecommerce record
      const transactionEcommerce = new TransactionEcommerce()
      transactionEcommerce.transactionId = transaction.id
      transactionEcommerce.voucherId = voucherDb?.id ?? null
      transactionEcommerce.tokenMidtrans = snap.token
      transactionEcommerce.redirectUrl = snap.redirect_url
      transactionEcommerce.shippingCost = shippingPrice
      transactionEcommerce.userAddressId = userAddressId
      transactionEcommerce.courierName = courierName
      transactionEcommerce.courierService = courierService
      await transactionEcommerce.useTransaction(trx).save()

      // ✅ reduce voucher qty (rollback kalau gagal bayar di webhook)
      if (voucherDb) {
        voucherDb.qty = Number(voucherDb.qty || 0) - 1
        await voucherDb.useTransaction(trx).save()
      }

      // ✅ stock reduce + create details + delete cart
      for (const cart of carts) {
        const qty = cart.qtyCheckout > 0 ? cart.qtyCheckout : cart.qty
        if (!cart.productVariantId) continue

        const productVariant = await ProductVariant.query({ client: trx })
          .preload('product')
          .where('id', cart.productVariantId)
          .forUpdate()
          .first()

        if (!productVariant) {
          await trx.rollback()
          return response.status(400).send({ message: 'Product variant not found.', serve: [] })
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

        await cart.useTransaction(trx).delete()

        const transactionDetail = new TransactionDetail()
        transactionDetail.qty = qty
        transactionDetail.price = cart.price
        transactionDetail.amount = ((Number(cart.price) - Number(cart.discount || 0)) * qty).toString()
        transactionDetail.discount = cart.discount
        transactionDetail.attributes = cart.attributes ?? ''
        transactionDetail.transactionId = transaction.id
        transactionDetail.productId = cart.productId ?? 0
        transactionDetail.productVariantId = cart.productVariantId
        await transactionDetail.useTransaction(trx).save()

        if (cart.productId) {
          const product = await Product.query({ client: trx }).where('id', cart.productId).first()
          if (product) {
            product.popularity = Number(product.popularity || 0) + 1
            await product.useTransaction(trx).save()
          }
        }
      }

      // ✅ shipment
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
      transactionShipment.isProtected = isProtected
      transactionShipment.protectionFee = protectionFee.toString()
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
    } catch (e) {
      console.log(e)
      await trx.rollback()
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  // =========================
  // MIDTRANS WEBHOOK
  // =========================
  public async webhookMidtrans({ request, response }: HttpContext) {
    const trx = await db.transaction()
    const S: any = TransactionStatus as any

    const STATUS_ON_PROCESS = (S.ON_PROCESS ?? 'ON_PROCESS').toString()
    const STATUS_WAITING = (S.WAITING_PAYMENT ?? S.PENDING ?? S.WAITING ?? 'WAITING_PAYMENT').toString()
    const STATUS_FAILED = (S.FAILED ?? S.CANCELLED ?? 'FAILED').toString()

    try {
      const orderId = request.input('order_id')
      const statusCode = request.input('status_code')
      const grossAmount = request.input('gross_amount')
      const signatureKey = request.input('signature_key')

      // ✅ verify signature (anti spoof)
      const serverKey = env.get('MIDTRANS_SERVER_KEY')
      const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
      const expected = createHash('sha512').update(raw).digest('hex')

      if (!signatureKey || expected !== signatureKey) {
        await trx.rollback()
        return response.status(401).json({ message: 'Invalid signature', serve: [] })
      }

      const transaction = await Transaction.query({ client: trx })
        .where('transaction_number', orderId)
        .first()

      // ✅ kalau gak ketemu, balikin 200 biar midtrans gak retry spam
      if (!transaction) {
        await trx.commit()
        return response.status(200).json({ message: 'ok', serve: [] })
      }

      const ecommerce = await TransactionEcommerce.query({ client: trx })
        .where('transaction_id', transaction.id)
        .first()

      const transactionStatus = request.input('transaction_status')
      const fraudStatus = request.input('fraud_status')
      const paymentType = request.input('payment_type') || null

      if (ecommerce) {
        ecommerce.paymentMethod = paymentType
        ecommerce.receipt =
          request.input('transaction_id') ||
          request.input('va_numbers')?.[0]?.va_number ||
          null
        await ecommerce.useTransaction(trx).save()
      }

      const isSuccess =
        (transactionStatus === 'capture' && fraudStatus === 'accept') ||
        transactionStatus === 'settlement'

      const isPending =
        transactionStatus === 'pending' ||
        (transactionStatus === 'capture' && fraudStatus === 'challenge')

      const isFailed =
        transactionStatus === 'cancel' ||
        transactionStatus === 'expire' ||
        transactionStatus === 'deny' ||
        fraudStatus === 'deny'

      if (isSuccess) {
        ;(transaction as any).transactionStatus = STATUS_ON_PROCESS
        await transaction.useTransaction(trx).save()
        await trx.commit()
        return response.status(200).json({ message: 'ok', serve: [] })
      }

      if (isPending) {
        ;(transaction as any).transactionStatus = STATUS_WAITING
        await transaction.useTransaction(trx).save()
        await trx.commit()
        return response.status(200).json({ message: 'ok', serve: [] })
      }

      if (isFailed) {
        // rollback stock
        const details = await TransactionDetail.query({ client: trx })
          .where('transaction_id', transaction.id)

        for (const d of details) {
          if (!d.productVariantId) continue

          const variant = await ProductVariant.query({ client: trx })
            .where('id', d.productVariantId)
            .forUpdate()
            .first()

          if (variant) {
            variant.stock = Number(variant.stock || 0) + Number(d.qty || 0)
            await variant.useTransaction(trx).save()
          }
        }

        // rollback voucher qty
        if (ecommerce?.voucherId) {
          const v = await Voucher.query({ client: trx }).where('id', ecommerce.voucherId).first()
          if (v) {
            v.qty = Number(v.qty || 0) + 1
            await v.useTransaction(trx).save()
          }
        }

        ;(transaction as any).transactionStatus = STATUS_FAILED
        await transaction.useTransaction(trx).save()
      }

      await trx.commit()
      return response.status(200).json({ message: 'ok', serve: [] })
    } catch (error) {
      await trx.rollback()
      return response.status(500).json({ message: error.message, serve: [] })
    }
  }

  // =========================
  // GET BY TRANSACTION NUMBER (detail)
  // =========================
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
        } catch (error) {
          console.log(' Error fetching waybill:', error.response?.data || error.message)
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
    } catch (error) {
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  // =========================
  // CONFIRM ORDER
  // =========================
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

      ;(transaction as any).transactionStatus = (TransactionStatus as any).COMPLETED?.toString?.() ?? 'COMPLETED'
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
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  // =========================
  // PICKUP & WAYBILL
  // =========================
  public async requestPickup({ request, response }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const pickupDate = request.input('pickup_date')
      const pickupTime = request.input('pickup_time')
      const pickupVehicle = request.input('pickup_vehicle')

      const transaction = await Transaction.query()
        .where('transaction_number', transactionNumber)
        .preload('shipments')
        .first()

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
      const data = await pickupService.requestPickup(
        shipment.resiNumber,
        pickupDate,
        pickupTime,
        pickupVehicle
      )

      return response.status(200).send({
        message: 'Pickup request processed',
        serve: data,
      })
    } catch (error) {
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
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  // =========================
  // HELPERS
  // =========================
  private toInt(v: any) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.round(n))
  }

  private calculateVoucher(data: any, price: string, shippingPrice: string) {
    if (!data) return 0
    if (data.isPercentage === 1) {
      if (data.type === 2) {
        const disc = (parseInt(shippingPrice || '0') * (parseInt(data.percentage || '0') / 100)) | 0
        if (disc > parseInt(data.maxDiscPrice || '0')) {
          return Math.min(parseInt(data.maxDiscPrice || '0'), parseInt(shippingPrice || '0'))
        }
        return Math.min(disc, parseInt(shippingPrice || '0'))
      } else {
        const disc = (parseInt(price || '0') * (parseInt(data.percentage || '0') / 100)) | 0
        return Math.min(disc, parseInt(data.maxDiscPrice || '0'))
      }
    } else {
      if (data.type === 2) {
        return Math.min(parseInt(data.price || '0'), parseInt(shippingPrice || '0'))
      } else {
        return parseInt(data.price || '0')
      }
    }
  }

  private generateGrandTotal(data: any, price: string, shippingPrice: string) {
    return (
      parseInt(price || '0') +
      parseInt(shippingPrice || '0') -
      (this.calculateVoucher(data, price, shippingPrice) || 0)
    )
  }

  private generateTransactionNumber() {
    const date = new Date()
    const tahun = date.getFullYear()
    const bulan = (date.getMonth() + 1).toString().padStart(2, '0')
    const tanggal = date.getDate().toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `AB${tahun}${bulan}${tanggal}${random}`
  }
}
