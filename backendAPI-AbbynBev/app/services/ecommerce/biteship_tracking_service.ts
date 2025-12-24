// app/services/ecommerce/biteship_tracking_service.ts
import BiteshipService from '#services/biteship_service'
import { TransactionStatus } from '../../enums/transaction_status.js'

export class BiteshipTrackingService {
  private isDelivered(status: any) {
    const s = String(status || '').toLowerCase()
    return s.includes('delivered') || s.includes('completed') || s.includes('selesai') || s.includes('success')
  }

  private isFailed(status: any) {
    const s = String(status || '').toLowerCase()
    return s.includes('cancel') || s.includes('failed') || s.includes('return')
  }

  private isInTransit(status: any) {
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

  async syncIfPossible(trxModel: any, shipment: any) {
    const current = String(trxModel?.transactionStatus || '')

    const isFinal =
      current === TransactionStatus.COMPLETED.toString() ||
      current === TransactionStatus.FAILED.toString()

    if (isFinal) return

    if (!shipment?.resiNumber || !shipment?.service) return

    const waybillId = String(shipment.resiNumber).trim()
    const courierCode = String(shipment.service).trim().toLowerCase()

    const tracking = await BiteshipService.retrievePublicTracking(waybillId, courierCode)

    if (tracking?.success && tracking?.status) {
      const bsStatus = String(tracking.status)

      shipment.status = bsStatus
      await shipment.save()

      if (this.isDelivered(bsStatus)) {
        trxModel.transactionStatus = TransactionStatus.COMPLETED.toString()
        await trxModel.save()
      } else if (this.isFailed(bsStatus)) {
        trxModel.transactionStatus = TransactionStatus.FAILED.toString()
        await trxModel.save()
      } else if (current === TransactionStatus.ON_PROCESS.toString() && this.isInTransit(bsStatus)) {
        trxModel.transactionStatus = TransactionStatus.ON_DELIVERY.toString()
        await trxModel.save()
      }
    }
  }
}
