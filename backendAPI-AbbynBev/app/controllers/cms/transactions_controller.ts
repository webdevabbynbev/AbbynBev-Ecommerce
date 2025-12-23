import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import ProductVariant from '#models/product_variant'
import Voucher from '#models/voucher'
import { TransactionStatus } from '../../enums/transaction_status.js'
import env from '#start/env'
import BiteshipService from '#services/biteship_service'

function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function parseIds(input: any): number[] {
  if (!Array.isArray(input)) return []
  return input.map((x) => toNumber(x)).filter((x) => x > 0)
}

function pickFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

function toPostalNumber(v: any): number | undefined {
  const s = String(v ?? '').replace(/\D/g, '')
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
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
   * ✅ Generate resi (Biteship)
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
        .forUpdate()
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

      const shipment: any = transaction.shipments?.[0]
      if (!shipment) {
        await trx.rollback()
        return response.status(404).send({ message: 'Shipment not found.', serve: [] })
      }

      // ✅ cegah double create resi
      if (shipment.resiNumber) {
        await trx.rollback()
        return response.status(400).send({ message: 'Resi sudah ada untuk transaksi ini.', serve: [] })
      }

      const user: any = transaction.ecommerce?.user
      const userAddress: any = transaction.ecommerce?.userAddress
      if (!user || !userAddress) {
        await trx.rollback()
        return response.status(400).send({ message: 'User address not found.', serve: [] })
      }

      // total weight (buat info)
      const totalWeight = transaction.details.reduce((acc: number, d: any) => {
        const productWeight = Number(d.product?.weight || 0)
        const qty = Number(d.qty || 0)
        return acc + productWeight * qty
      }, 0)

      // =========================
      // ORIGIN (TOKO)
      // =========================
      const originAreaId = String(env.get('BITESHIP_ORIGIN_AREA_ID') || '').trim()
      const originPostal = toPostalNumber(env.get('COMPANY_POSTAL_CODE'))

      if (!originAreaId && !originPostal) {
        await trx.rollback()
        return response.status(500).send({
          message: 'Origin Biteship belum diset. Isi BITESHIP_ORIGIN_AREA_ID atau COMPANY_POSTAL_CODE',
          serve: [],
        })
      }

      const originContactName = String(env.get('COMPANY_CONTACT_NAME') || 'Abby n Bev Store')
      const originContactPhone = String(env.get('COMPANY_CONTACT_PHONE') || env.get('COMPANY_PHONE') || '')
      const originAddress = String(env.get('COMPANY_ADDRESS') || '')

      if (!originContactPhone || !originAddress) {
        await trx.rollback()
        return response.status(500).send({
          message: 'COMPANY_CONTACT_PHONE/COMPANY_PHONE dan COMPANY_ADDRESS wajib ada untuk create order Biteship.',
          serve: [],
        })
      }

      // =========================
      // DESTINATION (CUSTOMER)
      // =========================
      const destAreaId = pickFirstString(userAddress, [
        'biteshipAreaId',
        'biteship_area_id',
        'destinationAreaId',
        'destination_area_id',
        'areaId',
        'area_id',
      ])

      const destPostal = toPostalNumber(
        pickFirstString(userAddress, ['postalCode', 'postal_code', 'zipCode', 'zip', 'kodePos', 'kode_pos'])
      )

      if (!destAreaId && !destPostal) {
        await trx.rollback()
        return response.status(400).send({
          message:
            'Alamat customer harus punya biteship area_id atau postal_code (kode pos) untuk create order Biteship.',
          serve: [],
        })
      }

      const destinationContactName = String(shipment.pic || user.fullName || user.name || 'Customer')
      const destinationContactPhone = String(shipment.pic_phone || user.phone || '')
      const destinationAddress = String(userAddress.address || '')

      if (!destinationContactPhone || !destinationAddress) {
        await trx.rollback()
        return response.status(400).send({
          message: 'PIC phone / alamat tujuan wajib ada untuk create order Biteship.',
          serve: [],
        })
      }

      // =========================
      // ITEMS
      // =========================
      const items = transaction.details.map((d: any) => {
        const price = Number(d.variant?.price ?? d.price ?? 0)
        const weight = Number(d.product?.weight ?? 0) || 1 // gram (pastikan DB gram)
        return {
          name: d.product?.name || 'Item',
          description: d.product?.description || undefined,
          category: 'beauty',
          value: Math.max(0, Math.round(price)),
          quantity: Math.max(1, toNumber(d.qty, 1)),
          weight: Math.max(1, Math.round(weight)),
          length: Number(d.variant?.length) || undefined,
          width: Number(d.variant?.width) || undefined,
          height: Number(d.variant?.height) || undefined,
          sku: d.variant?.sku || undefined,
        }
      })

      if (!items.length) {
        await trx.rollback()
        return response.status(400).send({ message: 'Order items kosong.', serve: [] })
      }

      const courierCompany = String(shipment.service || '').toLowerCase()
      const courierType = String(shipment.serviceType || '').toLowerCase()

      if (!courierCompany || !courierType) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Courier company / type kosong di shipment. Pastikan user memilih shipping method saat checkout.',
          serve: [],
        })
      }

      // reference_id harus unik per order
      const referenceId = String(transaction.transactionNumber || transaction.id)

      const biteshipPayload: any = {
        shipper_contact_name: String(env.get('COMPANY_NAME') || 'Abby n Bev'),
        shipper_contact_phone: String(env.get('COMPANY_PHONE') || originContactPhone),
        shipper_contact_email: String(env.get('COMPANY_EMAIL') || 'support@abbynbev.com'),
        shipper_organization: String(env.get('COMPANY_ORG') || 'Abby n Bev'),

        origin_contact_name: originContactName,
        origin_contact_phone: originContactPhone,
        origin_address: originAddress,
        ...(originAreaId ? { origin_area_id: originAreaId } : { origin_postal_code: originPostal }),

        destination_contact_name: destinationContactName,
        destination_contact_phone: destinationContactPhone,
        destination_contact_email: user.email || undefined,
        destination_address: destinationAddress,
        ...(destAreaId ? { destination_area_id: destAreaId } : { destination_postal_code: destPostal }),

        courier_company: courierCompany,
        courier_type: courierType,

        // delivery_type "now" -> generate waybill instantly
        delivery_type: 'now',
        reference_id: referenceId,
        metadata: { transaction_id: transaction.id },

        items,
      }

      try {
        const data: any = await BiteshipService.createOrder(biteshipPayload)

        if (!data?.success) {
          await trx.rollback()
          return response.status(400).send({
            message: data?.error || 'Gagal create order Biteship.',
            serve: data,
          })
        }

        const waybillId = data?.courier?.waybill_id
        if (!waybillId) {
          await trx.rollback()
          return response.status(400).send({
            message: 'Waybill (resi) tidak ditemukan dari response Biteship.',
            serve: data,
          })
        }

        shipment.resiNumber = waybillId
        await shipment.useTransaction(trx).save()

        transaction.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
        await transaction.useTransaction(trx).save()

        await trx.commit()
        return response.status(200).send({
          message: 'Resi berhasil dibuat (Biteship).',
          serve: {
            transaction_number: transaction.transactionNumber,
            resi_number: waybillId,
            tracking_id: data?.courier?.tracking_id,
            courier: courierCompany,
            service_type: courierType,
            total_weight: totalWeight,
          },
        })
      } catch (e: any) {
        const body = e?.response?.data

        // kalau reference_id sudah pernah dipakai: code 40002060 + details.waybill_id
        if (body?.code === 40002060 && body?.details?.waybill_id) {
          shipment.resiNumber = body.details.waybill_id
          await shipment.useTransaction(trx).save()

          transaction.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
          await transaction.useTransaction(trx).save()

          await trx.commit()
          return response.status(200).send({
            message: 'Order Biteship sudah pernah dibuat (reference_id pernah dipakai).',
            serve: {
              transaction_number: transaction.transactionNumber,
              resi_number: body.details.waybill_id,
              order_id: body.details.order_id,
              total_weight: totalWeight,
            },
          })
        }

        await trx.rollback()
        return response.status(400).send({
          message: body?.error || e.message || 'Gagal create order Biteship.',
          serve: body || null,
        })
      }
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
