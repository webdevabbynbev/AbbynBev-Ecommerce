// app/services/ecommerce/ecommerce_order_service.ts
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import { TransactionStatus } from '../../enums/transaction_status.js'

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

    // sync biteship jika memungkinkan
    try {
      const trxModel: any = (dataTransaction as any).transaction
      const trxShipments = Array.isArray(trxModel?.shipments) ? trxModel.shipments : []
      const ecoShipments = Array.isArray((dataTransaction as any)?.shipments) ? (dataTransaction as any).shipments : []
      const shipment: any = trxShipments[0] || ecoShipments[0] || null
      if (trxModel && shipment) {
        await this.tracking.syncIfPossible(trxModel, shipment)
      }
    } catch (e: any) {
      // swallow, jangan ganggu response utama
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

      if (transaction.transactionStatus !== TransactionStatus.ON_DELIVERY.toString()) {
        const err: any = new Error('Pesanan belum dikirim, belum bisa dikonfirmasi selesai.')
        err.httpStatus = 400
        throw err
      }

      transaction.transactionStatus = TransactionStatus.COMPLETED.toString()
      await transaction.useTransaction(trx).save()

      if (transaction.shipments.length > 0) {
        const shipment = transaction.shipments[0]
        shipment.status = 'Delivered'
        await shipment.useTransaction(trx).save()
      }

      return transaction
    })
  }

  async updateWaybillStatus(transactionNumber: string, newStatus: any) {
    const transaction = await Transaction.query().where('transaction_number', transactionNumber).preload('shipments').first()

    if (!transaction || transaction.shipments.length === 0) {
      const err: any = new Error('Transaction or shipment not found')
      err.httpStatus = 404
      throw err
    }

    const shipment = transaction.shipments[0]
    shipment.status = newStatus
    await shipment.save()

    return shipment
  }
}
