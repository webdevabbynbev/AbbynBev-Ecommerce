import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import ProductVariant from '#models/product_variant'
import Voucher from '#models/voucher'
import { TransactionStatus } from '../../enums/transaction_status.js'
import axios from 'axios'
import env from '#start/env'

function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parseIds(input: any): number[] {
  if (!Array.isArray(input)) return []
  return input.map((x) => toNumber(x)).filter((x) => x > 0)
}

export default class TransactionsController {
  public async get({ response, request }: HttpContext) {
    try {
      const {
        transaction_number,
        transaction_status,
        user,
        start_date,
        end_date,
        channel,
        page,
        per_page,
      } = request.qs()

      const pageNumber = isNaN(parseInt(page)) ? 1 : parseInt(page)
      const perPage = isNaN(parseInt(per_page)) ? 10 : parseInt(per_page)

      const dataTransaction = await Transaction.query()
        .if(transaction_number, (query) => {
          query.where('transaction_number', transaction_number)
        })
        .if(transaction_status, (query) => {
          // support multi-status: "1,5,2"
          const raw = String(transaction_status || '')
          const arr = raw
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)

          if (arr.length > 1) query.whereIn('transaction_status', arr)
          else if (arr.length === 1) query.where('transaction_status', arr[0])
        })
        .if(user, (query) => {
          query.where('user_id', user)
        })
        .if(start_date, (query) => {
          query.where('created_at', '>=', start_date)
        })
        .if(end_date, (query) => {
          query.where('created_at', '<=', end_date)
        })
        .if(channel, (query) => {
          if (channel === 'ecommerce') query.whereHas('ecommerce', () => {})
          if (channel === 'pos') query.whereHas('pos', () => {})
        })
        .preload('details', (detailsQuery) => {
          detailsQuery.preload('product', (productLoader) => {
            productLoader.preload('medias')
          })
          detailsQuery.preload('variant')
        })
        .preload('user')
        .preload('shipments')
        .preload('ecommerce')
        .preload('pos')
        .orderBy('created_at', 'desc')
        .paginate(pageNumber, perPage)

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataTransaction.toJSON().data,
          ...dataTransaction.toJSON().meta,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  /**
   * ✅ Admin confirm:
   * dari "PAID_WAITING_ADMIN" -> "ON_PROCESS"
   * Body: { transaction_id: number }
   */
  public async confirmPaidOrder({ response, request }: HttpContext) {
    const trx = await db.transaction()
    try {
      const transactionId = toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        await trx.rollback()
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const transaction = await Transaction.query({ client: trx })
        .where('id', transactionId)
        .forUpdate()
        .first()

      if (!transaction) {
        await trx.rollback()
        return response.status(404).send({ message: 'Transaction not found.', serve: [] })
      }

      // hanya boleh confirm kalau sudah bayar dan menunggu admin
      if (String(transaction.transactionStatus) !== TransactionStatus.PAID_WAITING_ADMIN.toString()) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Transaksi belum dibayar / tidak dalam status menunggu konfirmasi admin.',
          serve: [],
        })
      }

      transaction.transactionStatus = TransactionStatus.ON_PROCESS.toString()
      await transaction.useTransaction(trx).save()

      await trx.commit()
      return response.status(200).send({
        message: 'Pesanan berhasil dikonfirmasi admin.',
        serve: transaction,
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  /**
   * ✅ Generate resi (Komerce)
   * hanya boleh kalau status sudah ON_PROCESS (sudah confirm admin)
   */
  public async updateReceipt({ response, request }: HttpContext) {
    const trx = await db.transaction()
    try {
      const transactionId = toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        await trx.rollback()
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const transaction = await Transaction.query({ client: trx })
        .where('id', transactionId)
        .preload('details', (detail) => {
          detail.preload('product')
          detail.preload('variant')
        })
        .preload('shipments')
        .preload('ecommerce', (ec) => {
          ec.preload('userAddress', (addr) => {
            addr.preload('provinceData')
            addr.preload('cityData')
            addr.preload('districtData')
            addr.preload('subDistrictData')
          })
          ec.preload('user')
        })
        .first()

      if (!transaction) {
        await trx.rollback()
        return response.status(404).send({ message: 'Transaction not found.', serve: [] })
      }

      // ✅ kunci flow: harus confirm admin dulu
      if (String(transaction.transactionStatus) !== TransactionStatus.ON_PROCESS.toString()) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Order harus dikonfirmasi admin dulu sebelum generate resi.',
          serve: [],
        })
      }

      const shipment = transaction.shipments[0]
      if (!shipment) {
        await trx.rollback()
        return response.status(404).send({ message: 'Shipment not found.', serve: [] })
      }

      // ✅ cegah double create resi
      if (shipment.resiNumber) {
        await trx.rollback()
        return response.status(400).send({ message: 'Resi sudah ada untuk transaksi ini.', serve: [] })
      }

      const user = transaction.ecommerce?.user
      const userAddress = transaction.ecommerce?.userAddress
      if (!user || !userAddress) {
        await trx.rollback()
        return response.status(400).send({ message: 'User address not found.', serve: [] })
      }

      const totalWeight = transaction.details.reduce((acc, d) => {
        const productWeight = d.product?.weight || 0
        return acc + productWeight * d.qty
      }, 0)

      const orderDetails = transaction.details.map((d) => {
        const variantPrice = Number(d.variant?.price ?? d.price)

        return {
          product_name: d.product?.name || 'Unknown',
          product_variant_name: d.variant?.sku || '-',
          product_price: variantPrice,
          product_weight: Number(d.product?.weight) || 0,
          product_width: Number(d.variant?.width) || 0,
          product_height: Number(d.variant?.height) || 0,
          product_length: Number(d.variant?.length) || 0,
          qty: Number(d.qty),
          subtotal: variantPrice * Number(d.qty),
        }
      })

      const komercePayload = {
        order_date: new Date().toISOString().slice(0, 10),
        brand_name: 'Abby n Bev',
        shipper_name: 'Abby n Bev Store',
        shipper_phone: '628123456789',
        shipper_destination_id: env.get('KOMERCE_ORIGIN_ID') || 423,
        shipper_address: env.get('COMPANY_ADDRESS') || 'Jl. Dummy Bandung',
        shipper_email: 'support@abbynbev.com',
        origin_pin_point: env.get('COMPANY_PINPOINT') || '-6.914744, 107.609810',

        receiver_name: shipment.pic,
        receiver_phone: shipment.pic_phone,
        receiver_destination_id: userAddress.subDistrict,
        receiver_address: userAddress.address,
        receiver_email: user.email,
        destination_pin_point: '',

        shipping: shipment.service?.toUpperCase() || 'JNE',
        shipping_type: shipment.serviceType?.toUpperCase() || 'REG',
        shipping_cost: Number(shipment.price),
        shipping_cashback: 0,
        payment_method:
          env.get('NODE_ENV') === 'development'
            ? 'COD'
            : (transaction.ecommerce?.paymentMethod || 'COD').toUpperCase().replace('_', ' '),

        service_fee: Math.round(Number(transaction.amount) * 0.028),
        additional_cost: 0,
        grand_total: Number(transaction.amount),
        cod_value: Number(transaction.amount),
        insurance_value: (() => {
          const hasEligibleProduct = transaction.details.some((d) => {
            const variantPrice = Number(d.variant?.price ?? d.price)
            return variantPrice >= 300000
          })
          return hasEligibleProduct ? Number(shipment.protectionFee ?? 0) : 0
        })(),

        order_details: orderDetails,
      }

      const client = axios.create({
        baseURL: env.get('KOMERCE_DELIVERY_BASE_URL'),
        headers: {
          'x-api-key': env.get('KOMERCE_DELIVERY_API_KEY'),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      const { data } = await client.post('/order/api/v1/orders/store', komercePayload)

      if (data?.meta?.status === 'failed' || !data?.data?.order_no) {
        await trx.rollback()
        return response.status(400).send({
          message: data?.meta?.message || 'Failed to generate resi from Komerce API.',
          serve: data,
        })
      }

      shipment.resiNumber = data.data.order_no
      await shipment.useTransaction(trx).save()

      // setelah resi berhasil dibuat -> dikirim
      transaction.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
      await transaction.useTransaction(trx).save()

      await trx.commit()
      return response.status(200).send({
        message: 'Shipment created successfully.',
        serve: {
          transaction_number: transaction.transactionNumber,
          resi_number: shipment.resiNumber,
          courier: shipment.service,
          service_type: shipment.serviceType,
          total_weight: totalWeight,
        },
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.response?.data || error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  /**
   * ✅ Cancel transaksi dari CMS
   * - allowed: WAITING_PAYMENT / PAID_WAITING_ADMIN
   * - set FAILED
   * - restore stock variant + restore voucher qty
   */
  public async cancelTransactions({ request, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const transactionIds = parseIds(request.input('transactionIds'))
      if (!transactionIds.length) {
        await trx.rollback()
        return response.status(400).json({ message: 'Invalid transaction IDs' })
      }

      const transactions = await Transaction.query({ client: trx })
        .whereIn('id', transactionIds)
        .preload('details', (d) => d.preload('product'))
        .preload('ecommerce')

      if (transactions.length !== transactionIds.length) {
        await trx.rollback()
        return response.status(404).json({ message: 'Ada transaksi yang tidak ditemukan.' })
      }

      // validasi status
      for (const t of transactions) {
        const st = String(t.transactionStatus || '')
        const allowed =
          st === TransactionStatus.WAITING_PAYMENT.toString() ||
          st === TransactionStatus.PAID_WAITING_ADMIN.toString()

        if (!allowed) {
          await trx.rollback()
          return response.status(400).json({
            message: `Transaksi ${t.transactionNumber} tidak bisa dicancel karena statusnya tidak valid.`,
          })
        }
      }

      for (const t of transactions as any[]) {
        // restore stock
        for (const detail of t.details) {
          if (!detail.productVariantId) continue

          const pv = await ProductVariant.query({ client: trx })
            .where('id', detail.productVariantId)
            .forUpdate()
            .first()

          if (pv) {
            pv.stock = toNumber(pv.stock) + toNumber(detail.qty)
            await pv.useTransaction(trx).save()
          }

          // popularity rollback (optional)
          if (detail.product) {
            detail.product.popularity = Math.max(0, toNumber(detail.product.popularity) - 1)
            await detail.product.useTransaction(trx).save()
          }
        }

        // restore voucher qty
        const voucherId = t.ecommerce?.voucherId
        if (voucherId) {
          const v = await Voucher.query({ client: trx }).where('id', voucherId).forUpdate().first()
          if (v) {
            v.qty = toNumber(v.qty) + 1
            await v.useTransaction(trx).save()
          }
        }

        // set FAILED
        t.transactionStatus = TransactionStatus.FAILED.toString()
        await t.useTransaction(trx).save()
      }

      await trx.commit()
      return response.status(200).json({
        message: 'Transactions successfully canceled. Stock & voucher restored.',
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).json({
        message: 'An error occurred while canceling transactions',
        error: error.message,
      })
    }
  }
}
