// app/services/ecommerce/ecommerce_order_service.ts
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import { TransactionStatus } from '../../enums/transaction_status.js'
import { DateTime } from 'luxon'

import { EcommerceRepository } from './ecommerce_repository.js'
import { BiteshipTrackingService } from './biteship_tracking_service.js'

export class EcommerceOrderService {
  private repo = new EcommerceRepository()
  private tracking = new BiteshipTrackingService()

  async getList(userId: number, qs: any) {
    return this.repo.listForUser(userId, qs)
  }

  async getByTransactionNumber(transactionNumber: string) {
    const dataTransaction = await this.repo.findByTransactionNumber(transactionNumber)
    if (!dataTransaction) {
      const err: any = new Error('Transaction not found.')
      err.httpStatus = 400
      throw err
    }

    // ✅ sync biteship jika memungkinkan (biar deliveredAt bisa keisi otomatis)
    try {
      // beberapa repo mengembalikan struktur beda, jadi kita amankan
      const trxModel: any =
        (dataTransaction as any)?.transaction ||
        (dataTransaction as any)?.dataTransaction?.transaction ||
        null

      // shipment bisa muncul di trxModel.shipments atau dataTransaction.shipments
      const trxShipments = Array.isArray(trxModel?.shipments) ? trxModel.shipments : []
      const ecoShipments = Array.isArray((dataTransaction as any)?.shipments)
        ? (dataTransaction as any).shipments
        : []

      const shipment: any = trxShipments[0] || ecoShipments[0] || null

      if (trxModel && shipment) {
        await this.tracking.syncIfPossible(trxModel, shipment)
      }
    } catch (e: any) {
      console.log('Biteship sync error:', e?.response?.data || e?.message || e)
    }

    return { dataTransaction, waybill: null }
  }

  async confirmOrder(userId: number, transactionNumber: string) {
    return db.transaction(async (trx) => {
      const transaction = await Transaction.query({ client: trx })
        .where('transaction_number', transactionNumber)
        .where('user_id', userId)
        .preload('shipments')
        .first()

      if (!transaction) {
        const err: any = new Error('Transaction not found.')
        err.httpStatus = 404
        throw err
      }

      // cuma boleh confirm kalau sedang ON_DELIVERY
      if (Number(transaction.transactionStatus) !== TransactionStatus.ON_DELIVERY) {
        const err: any = new Error('Pesanan belum dikirim, belum bisa dikonfirmasi selesai.')
        err.httpStatus = 400
        throw err
      }

      transaction.transactionStatus = TransactionStatus.COMPLETED.toString()
      await transaction.useTransaction(trx).save()

      if (transaction.shipments.length > 0) {
        const shipment: any = transaction.shipments[0]

        shipment.status = 'delivered'

        // ✅ proper delivery date
        if (!shipment.deliveredAt) {
          shipment.deliveredAt = DateTime.now()
        }

        await shipment.useTransaction(trx).save()
      }

      return transaction
    })
  }

  async updateWaybillStatus(transactionNumber: string, newStatus: any) {
    const transaction = await Transaction.query()
      .where('transaction_number', transactionNumber)
      .preload('shipments')
      .first()

    if (!transaction || transaction.shipments.length === 0) {
      const err: any = new Error('Transaction or shipment not found')
      err.httpStatus = 404
      throw err
    }

    const shipment: any = transaction.shipments[0]
    const statusText = String(newStatus || '').trim()

    shipment.status = statusText

    // ✅ kalau status jadi delivered dari admin/system, set deliveredAt (sekali)
    const lower = statusText.toLowerCase()
    const delivered =
      lower.includes('delivered') ||
      lower.includes('completed') ||
      lower.includes('selesai') ||
      lower.includes('success') ||
      lower.includes('done')

    if (delivered && !shipment.deliveredAt) {
      shipment.deliveredAt = DateTime.now()
    }

    await shipment.save()

    // opsional: sekalian update transaction status biar konsisten
        if (delivered && transaction.transactionStatus !== TransactionStatus.ON_DELIVERY.toString()) {
      transaction.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
      await transaction.save()
    }

    return shipment
  }
}
