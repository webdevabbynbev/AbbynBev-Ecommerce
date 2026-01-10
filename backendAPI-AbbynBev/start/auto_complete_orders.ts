import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import BiteshipService from '#services/biteship_service'
import db from '@adonisjs/lucid/services/db'
import { TransactionStatus } from '../app/enums/transaction_status.js'

function isDeliveredStatus(v: any) {
  const s = String(v || '').toLowerCase()
  return (
    s.includes('delivered') ||
    s.includes('completed') ||
    s.includes('success') ||
    s.includes('done') ||
    s.includes('berhasil') ||
    s.includes('selesai')
  )
}

// biar ga dobel interval saat HMR
const g: any = globalThis as any
if (!g.__AUTO_COMPLETE_ORDERS_TIMER__) {
  const EVERY_MINUTES = 60 // cek tiap 60 menit
  const AFTER_DAYS = 3      // auto complete setelah 3 hari

  let running = false

  const job = async () => {
    if (running) return
    running = true

    const trxDb = await db.transaction()

    try {
      // 1) ambil transaksi ON_DELIVERY yang punya resi
      const txs = await Transaction.query({ client: trxDb })
        .where('transactionStatus', TransactionStatus.ON_DELIVERY)
        .preload('shipments')
        .limit(50)

      // 2) sync status dari biteship → kalau delivered, set shipment.status = 'Delivered' sekali
      for (const t of txs as any[]) {
        const sh = t.shipments?.[0]
        if (!sh?.resiNumber) continue

        // kalau sudah delivered, jangan update lagi (biar updatedAt jadi "delivered timestamp" pertama)
        if (String(sh.status || '') === 'Delivered') continue

        const courierCode = String(sh.service || '').toLowerCase().trim()
        if (!courierCode) continue

        try {
          const track = await BiteshipService.getTrackingByWaybill(String(sh.resiNumber), courierCode)
          const st = track?.status || ''

          if (isDeliveredStatus(st)) {
             sh.status = 'Delivered'
            if (!sh.deliveredAt) {
              sh.deliveredAt = DateTime.now()
            }
            await sh.useTransaction(trxDb).save()
          } else if (st && String(sh.status || '') !== String(st)) {
            // optional: simpan status progress (Pickup/On Process/dll)
            sh.status = String(st)
            await sh.useTransaction(trxDb).save()
          }
        } catch {
          // ignore per transaksi (biar job tetap jalan)
        }
      }

      // 3) auto complete jika delivered >= 3 hari
      const cutoff = DateTime.now().minus({ days: AFTER_DAYS }).toJSDate()

      const toComplete = await Transaction.query({ client: trxDb })
        .where('transactionStatus', TransactionStatus.ON_DELIVERY)
        .whereHas('shipments', (q) => {
          q.whereNotNull('delivered_at').where('delivered_at', '<=', cutoff)
        })
        .preload('shipments')
        .limit(200)

      for (const t of toComplete as any[]) {
        t.transactionStatus = String(TransactionStatus.COMPLETED)
        await t.useTransaction(trxDb).save()
      }

      await trxDb.commit()
    } catch (e) {
      await trxDb.rollback()
    } finally {
      running = false
    }
  }

  // jalanin sekali saat boot
  job()

  g.__AUTO_COMPLETE_ORDERS_TIMER__ = setInterval(job, EVERY_MINUTES * 60 * 1000)
}
