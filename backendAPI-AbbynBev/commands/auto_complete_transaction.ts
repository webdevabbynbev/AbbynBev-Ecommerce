import env from '#start/env'
import Transaction from '#models/transaction'
import BiteshipService from '#services/biteship_service'
import db from '@adonisjs/lucid/services/db'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import { TransactionStatus } from '../app/enums/transaction_status.js'
import { BiteshipStatusMapper } from '../app/services/shipping/biteship_status_mapper.js'

export default class AutoCompleteTransaction extends BaseCommand {
  static commandName = 'auto:complete-transaction'
  static description =
    'Sync Biteship tracking (shipping started + delivered) and auto-complete transactions after N days delivered.'

  static options: CommandOptions = {
    startApp: true,
  }

  private toInt(v: any, fallback: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  async run() {
    const mapper = new BiteshipStatusMapper()

    const AFTER_DAYS = this.toInt(env.get('AUTO_COMPLETE_AFTER_DAYS'), 3)
    const SYNC_LIMIT = this.toInt(env.get('AUTO_COMPLETE_SYNC_LIMIT'), 50)
    const COMPLETE_LIMIT = this.toInt(env.get('AUTO_COMPLETE_LIMIT'), 200)

    this.logger.info(`Auto complete job start`)
    this.logger.info(`AFTER_DAYS=${AFTER_DAYS}, SYNC_LIMIT=${SYNC_LIMIT}, COMPLETE_LIMIT=${COMPLETE_LIMIT}`)

    /**
     * 1) Sync tracking untuk transaksi ON_PROCESS + ON_DELIVERY yang sudah punya resi
     * - kalau shipping started: isi shipment.deliveredAt (mulai pengiriman) + tx jadi ON_DELIVERY
     * - kalau delivered: set shipment.status = 'Delivered' (sekali) -> updatedAt jadi "delivered timestamp"
     */
    const candidates = await Transaction.query()
      .whereIn('transactionStatus', [
        String(TransactionStatus.ON_PROCESS),
        String(TransactionStatus.ON_DELIVERY),
      ])
      .whereHas('shipments', (q) => q.whereNotNull('resi_number'))
      .preload('shipments')
      .limit(SYNC_LIMIT)

    let synced = 0
    let deliveredMarked = 0
    let shippingStartedMarked = 0

    for (const t of candidates as any[]) {
      const sh = t.shipments?.[0]
      if (!sh?.resiNumber) continue

      const courierCode = String(sh.service || '').toLowerCase().trim()
      if (!courierCode) continue

      // kalau udah "Delivered" jangan disentuh lagi (biar updatedAt tetap jadi delivered timestamp)
      if (String(sh.status || '') === 'Delivered') continue

      let track: any
      try {
        track = await BiteshipService.getTrackingByWaybill(String(sh.resiNumber), courierCode)
      } catch {
        continue
      }

      const st = String(track?.status || track?.data?.status || '').trim()
      if (!st) continue

      const isShippingStarted = mapper.isShippingStarted(st)
      const isDelivered = mapper.isDelivered(st)
      const isFailed = mapper.isFailed(st)

      const txCurrent = Number(t.transactionStatus)

      // update DB (pendek, jangan tahan transaksi sambil call API)
      await db.transaction(async (trx) => {
        t.useTransaction(trx)
        sh.useTransaction(trx)

        // status shipment
        const nextStatus = isDelivered ? 'Delivered' : st
        if (String(sh.status || '') !== nextStatus) {
          sh.status = nextStatus
        }

        // deliveredAt = mulai pengiriman (sekali)
        if (isShippingStarted && !sh.deliveredAt) {
          sh.deliveredAt = mapper.extractShippingStartedAt(track) || DateTime.now()
          shippingStartedMarked++
        }

        await sh.save()

        // status transaction
        if (isFailed) {
          if (txCurrent !== TransactionStatus.FAILED) {
            t.transactionStatus = String(TransactionStatus.FAILED)
            await t.save()
          }
          return
        }

        if (isShippingStarted && txCurrent !== TransactionStatus.ON_DELIVERY) {
          t.transactionStatus = String(TransactionStatus.ON_DELIVERY)
          await t.save()
        }

        if (isDelivered) deliveredMarked++
      })

      synced++
    }

    this.logger.info(
      `Tracking sync done: candidates=${candidates.length}, synced=${synced}, shippingStartedMarked=${shippingStartedMarked}, deliveredMarked=${deliveredMarked}`
    )

    /**
     * 2) Auto complete:
     * transaksi ON_DELIVERY yang shipment.status = 'Delivered'
     * dan shipment.updatedAt <= now - AFTER_DAYS
     */
    const cutoff = DateTime.now().minus({ days: AFTER_DAYS }).toJSDate()

    const toComplete = await Transaction.query()
      .where('transactionStatus', String(TransactionStatus.ON_DELIVERY))
      .whereHas('shipments', (q) => {
        q.where('status', 'Delivered').where('updated_at', '<=', cutoff)
      })
      .limit(COMPLETE_LIMIT)

    if (!toComplete.length) {
      this.logger.info('No transactions to complete.')
      return
    }

    const ids = toComplete.map((x: any) => x.id)

    const updated = await Transaction.query()
      .whereIn('id', ids)
      .update({ transactionStatus: String(TransactionStatus.COMPLETED) })

    this.logger.info(`Auto complete done: ${updated} transactions completed.`)
  }
}
