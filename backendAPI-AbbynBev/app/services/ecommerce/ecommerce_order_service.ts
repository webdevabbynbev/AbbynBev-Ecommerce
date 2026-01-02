// app/services/ecommerce/ecommerce_order_service.ts
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import { TransactionStatus } from '../../enums/transaction_status.js'

import { EcommerceRepository } from './ecommerce_repository.js'
import { BiteshipTrackingService } from '../shipping/biteship_tracking_service.js'

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

    // sync biteship kalau memungkinkan (biar deliveredAt keisi pas shipping dimulai)
    try {
      const trxModel: any =
        (dataTransaction as any)?.transaction ||
        (dataTransaction as any)?.dataTransaction?.transaction ||
        null

      const trxShipments = Array.isArray(trxModel?.shipments) ? trxModel.shipments : []
      const ecoShipments = Array.isArray((dataTransaction as any)?.shipments) ? (dataTransaction as any).shipments : []

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

      // confirm hanya kalau sudah ON_DELIVERY
      if (Number(transaction.transactionStatus) !== TransactionStatus.ON_DELIVERY) {
        const err: any = new Error('Pesanan belum dikirim, belum bisa dikonfirmasi selesai.')
        err.httpStatus = 400
        throw err
      }

      transaction.transactionStatus = TransactionStatus.COMPLETED.toString()
      await transaction.useTransaction(trx).save()

      // Optional: set status text aja
      if (transaction.shipments.length > 0) {
        const shipment: any = transaction.shipments[0]
        shipment.status = 'delivered'
        await shipment.useTransaction(trx).save()
      }

      return transaction
    })
  }

  /**
   * Manual update shipment status (admin/system).
   * RULE:
   * - kalau status masuk kategori pengiriman (on_delivery/pickup/in_transit/pengantaran) => set deliveredAt (sekali)
   */
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

    const lower = statusText.toLowerCase()

    const shippingStarted =
      lower.includes('picking_up') ||
      lower.includes('picked_up') ||
      lower.includes('pickup') ||
      lower.includes('in_transit') ||
      lower.includes('out_for_delivery') ||
      lower.includes('on_delivery') ||
      lower.includes('pengiriman') ||
      lower.includes('pengantaran') ||
      lower.includes('penjemputan') ||
      lower.includes('dikirim') ||
      lower.includes('diantar')

    if (shippingStarted && !shipment.deliveredAt) {
      // deliveredAt = waktu mulai pengiriman
      shipment.deliveredAt = shipment.deliveredAt ?? shipment.updatedAt
    }

    await shipment.save()

    if (shippingStarted && transaction.transactionStatus !== TransactionStatus.ON_DELIVERY.toString()) {
      transaction.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
      await transaction.save()
    }

    return shipment
  }
}
