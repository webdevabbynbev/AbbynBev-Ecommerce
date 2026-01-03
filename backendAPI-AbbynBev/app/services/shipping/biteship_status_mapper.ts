// app/services/shipping/biteship_status_mapper.ts
import { DateTime } from 'luxon'

export class BiteshipStatusMapper {
  norm(v: any) {
    return String(v || '').trim().toLowerCase()
  }

  isDelivered(status: any) {
    const s = this.norm(status)
    return (
      s.includes('delivered') ||
      s.includes('completed') ||
      s.includes('selesai') ||
      s.includes('success') ||
      s.includes('done') ||
      s.includes('berhasil')
    )
  }

  isFailed(status: any) {
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

  /**
   * Ini yang lo mau:
   * status "penjemputan/pengiriman/pengantaran" = shipping dimulai
   * -> deliveredAt harus keisi saat status masuk kategori ini
   */
  isShippingStarted(status: any) {
    const s = this.norm(status)
    return (
      s.includes('picking_up') ||
      s.includes('picking') ||
      s.includes('picked_up') ||
      s.includes('picked') ||
      s.includes('pickup') ||
      s.includes('in_transit') ||
      s.includes('transit') ||
      s.includes('out_for_delivery') ||
      s.includes('on_delivery') ||
      s.includes('dropping_off') ||
      s.includes('dropping') ||
      s.includes('shipped') ||
      s.includes('shipping') ||
      s.includes('courier') ||
      // Indonesia
      s.includes('penjemputan') ||
      s.includes('pengiriman') ||
      s.includes('pengantaran') ||
      s.includes('dikirim') ||
      s.includes('diantar')
    )
  }

  tryParseDate(v: any): DateTime | null {
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

  /**
   * Cari timestamp pertama kali status masuk "shipping started"
   * biar deliveredAt = waktu mulai dikirim (bukan delivered selesai)
   */
  extractShippingStartedAt(tracking: any): DateTime | null {
    const history = Array.isArray(tracking?.history)
      ? tracking.history
      : Array.isArray(tracking?.data?.history)
        ? tracking.data.history
        : []

    if (!history.length) return null

    for (let i = 0; i < history.length; i++) {
      const h = history[i]
      const hStatus = h?.status || h?.note || h?.description || h?.message || ''
      if (!this.isShippingStarted(hStatus)) continue

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
}
