import BiteshipService from '#services/biteship_service'
import Transaction from '#models/transaction'
import TransactionShipment from '#models/transaction_shipment'
import { TransactionStatus } from '../../enums/transaction_status.js'
import { DateTime } from 'luxon'
import { BiteshipStatusMapper } from './biteship_status_mapper.js'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class BiteshipTrackingService {
  private map = new BiteshipStatusMapper()

  private toNum(v: any, fallback = -1) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  private async ensureTransactionModel(trxModel: any, trx?: TransactionClientContract) {

    if (trxModel && typeof trxModel.save === 'function' && trxModel.id) {
      if (trx) trxModel.useTransaction?.(trx)
      return trxModel
    }

    const id = trxModel?.id ?? trxModel?.transactionId ?? trxModel?.transaction_id
    if (!id) return null

    const query = Transaction.query(trx ? { client: trx } : {})
      .where('id', id)
      .preload('shipments')

    return query.first()
  }

  private async ensureShipmentModel(shipment: any, trxId?: number, trx?: TransactionClientContract) {
    if (shipment && typeof shipment.save === 'function') {
      if (trx) shipment.useTransaction?.(trx)
      return shipment
    }

    const transactionId = shipment?.transactionId ?? shipment?.transaction_id ?? trxId
    if (!transactionId) return null

    return TransactionShipment.query(trx ? { client: trx } : {})
      .where('transaction_id', transactionId)
      .first()
  }

  async syncIfPossible(trxModel: any, shipment: any, trx?: TransactionClientContract) {
    const tx = await this.ensureTransactionModel(trxModel, trx)
    if (!tx) return

    const current = this.toNum(tx.transactionStatus)
    const isFinal = current === TransactionStatus.COMPLETED || current === TransactionStatus.FAILED
    if (isFinal) return

    const ship = await this.ensureShipmentModel(shipment, tx.id, trx)
    if (String((ship as any).status || '') === 'Delivered') return
    if (!ship) return

    const resi = String((ship as any).resiNumber || (ship as any).resi_number || '').trim()
    const service = String((ship as any).service || '').trim()
    if (!resi || !service) return

    const waybillId = resi
    const courierCode = service.toLowerCase()

    let tracking: any
    try {
      tracking = await BiteshipService.retrievePublicTracking(waybillId, courierCode)
    } catch (e: any) {
      console.log('Biteship tracking error:', e?.response?.data || e?.message || e)
      return
    }

    const rawStatus = tracking?.status ?? tracking?.data?.status
    if (!rawStatus) return

    const bsStatus = String(rawStatus).trim()

    ;(ship as any).status = bsStatus

    const shippingStarted = this.map.isShippingStarted(bsStatus)
    const deliveredFinal = this.map.isDelivered(bsStatus)
    const failedFinal = this.map.isFailed(bsStatus)

    if (shippingStarted && !(ship as any).deliveredAt) {
      ;(ship as any).deliveredAt = this.map.extractShippingStartedAt(tracking) || DateTime.now()
    }

    if (trx) (ship as any).useTransaction?.(trx)
    await (ship as any).save()

    if (failedFinal) {
      tx.transactionStatus = String(TransactionStatus.FAILED) as any
      if (trx) tx.useTransaction?.(trx)
      await tx.save()
      return
    }

    if (shippingStarted && current !== TransactionStatus.ON_DELIVERY) {
      tx.transactionStatus = String(TransactionStatus.ON_DELIVERY) as any
      if (trx) tx.useTransaction?.(trx)
      await tx.save()
      return
    }

    if (deliveredFinal) return
  }
}
