import BiteshipService from '#services/biteship_service'
import Transaction from '#models/transaction'
import TransactionShipment from '#models/transaction_shipment'
import { TransactionStatus } from '../../enums/transaction_status.js'
import { DateTime } from 'luxon'

export class BiteshipTrackingService {
  private norm(v: any) {
    return String(v || '').trim().toLowerCase()
  }

  private isDelivered(status: any) {
    const s = this.norm(status)
    return (
      s.includes('delivered') ||
      s.includes('completed') ||
      s.includes('selesai') ||
      s.includes('success') ||
      s.includes('done')
    )
  }

  private isFailed(status: any) {
    const s = this.norm(status)
    return (
      s.includes('cancel') ||
      s.includes('canceled') ||
      s.includes('failed') ||
      s.includes('fail') ||
      s.includes('return') ||
      s.includes('returned') ||
      s.includes('reject')
    )
  }

  private isInTransit(status: any) {
    const s = this.norm(status)
    return (
      s.includes('in_transit') ||
      s.includes('out_for_delivery') ||
      s.includes('on_delivery') ||
      s.includes('shipped') ||
      s.includes('shipping') ||
      s.includes('picked') ||
      s.includes('pickup') ||
      s.includes('dropp') || // dropped
      s.includes('hub') ||
      s.includes('sorting') ||
      s.includes('transit') ||
      s.includes('courier')
    )
  }

  private tryParseDate(v: any): DateTime | null {
    if (!v) return null
    if (v instanceof DateTime) return v

    if (typeof v === 'string') {
      const dt = DateTime.fromISO(v)
      return dt.isValid ? dt : null
    }

    if (typeof v === 'number') {
      const dt = DateTime.fromMillis(v)
      return dt.isValid ? dt : null
    }

    if (v instanceof Date) {
      const dt = DateTime.fromJSDate(v)
      return dt.isValid ? dt : null
    }

    return null
  }

  private extractDeliveredAtFromTracking(tracking: any): DateTime | null {
    const history = Array.isArray(tracking?.history)
      ? tracking.history
      : Array.isArray(tracking?.data?.history)
        ? tracking.data.history
        : []

    if (!history.length) return null

    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i]
      const hStatus = h?.status || h?.note || h?.description || h?.message || ''
      if (!this.isDelivered(hStatus)) continue

      return (
        this.tryParseDate(h?.updated_at) ||
        this.tryParseDate(h?.created_at) ||
        this.tryParseDate(h?.date) ||
        this.tryParseDate(h?.datetime) ||
        this.tryParseDate(h?.timestamp) ||
        null
      )
    }

    return null
  }

  private async ensureTransactionModel(trxModel: any) {
    if (trxModel && typeof trxModel.save === 'function' && trxModel.id) return trxModel
    const id = trxModel?.id ?? trxModel?.transactionId ?? trxModel?.transaction_id
    if (!id) return null
    return Transaction.query().where('id', id).preload('shipments').first()
  }

  private async ensureShipmentModel(shipment: any, trxId?: number) {
    if (shipment && typeof shipment.save === 'function') return shipment

    const transactionId =
      shipment?.transactionId ??
      shipment?.transaction_id ??
      trxId

    if (!transactionId) return null

    return TransactionShipment.query().where('transaction_id', transactionId).first()
  }

  /**
   * Sync tracking status dari Biteship (public tracking by waybill).
   * - update shipment.status
   * - set shipment.deliveredAt saat delivered (sekali saja)
   * - update transaction.transactionStatus sesuai mapping
   */
  async syncIfPossible(trxModel: any, shipment: any) {
    const trx = await this.ensureTransactionModel(trxModel)
    if (!trx) return

    const current = String(trx?.transactionStatus || '')
    const isFinal =
      current === TransactionStatus.COMPLETED.toString() ||
      current === TransactionStatus.FAILED.toString()

    if (isFinal) return

    const ship = await this.ensureShipmentModel(shipment, trx.id)
    if (!ship) return

    const resi = String((ship as any)?.resiNumber || shipment?.resiNumber || shipment?.resi_number || '').trim()
    const service = String((ship as any)?.service || shipment?.service || '').trim()

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

    if (this.isDelivered(bsStatus) && !(ship as any).deliveredAt) {
      ;(ship as any).deliveredAt = this.extractDeliveredAtFromTracking(tracking) || DateTime.now()
    }

    await (ship as any).save()

    if (this.isDelivered(bsStatus)) {
      if (current !== TransactionStatus.ON_DELIVERY.toString()) {
        trx.transactionStatus = TransactionStatus.ON_DELIVERY.toString() as any
        await trx.save()
      }
      return
    }
    
    if (this.isFailed(bsStatus)) {
      trx.transactionStatus = TransactionStatus.FAILED.toString() as any
      await trx.save()
      return
    }

    if (current === TransactionStatus.ON_PROCESS.toString() && this.isInTransit(bsStatus)) {
      trx.transactionStatus = TransactionStatus.ON_DELIVERY.toString() as any
      await trx.save()
      return
    }
  }
}
