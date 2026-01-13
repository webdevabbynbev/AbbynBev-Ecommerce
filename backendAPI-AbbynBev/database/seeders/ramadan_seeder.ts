import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // ✅ Insert sample data untuk ramadan_checkins
    // User dengan ID 9 dan 10 (guest users dari database yang sudah ada)
    const checkinData = [
      // User ID 9 - 15 hari puasa
      { user_id: 9, checkin_date: '2026-01-01' },
      { user_id: 9, checkin_date: '2026-01-02' },
      { user_id: 9, checkin_date: '2026-01-03' },
      { user_id: 9, checkin_date: '2026-01-04' },
      { user_id: 9, checkin_date: '2026-01-05' },
      { user_id: 9, checkin_date: '2026-01-06' },
      { user_id: 9, checkin_date: '2026-01-07' },
      { user_id: 9, checkin_date: '2026-01-08' },
      { user_id: 9, checkin_date: '2026-01-09' },
      { user_id: 9, checkin_date: '2026-01-10' },
      { user_id: 9, checkin_date: '2026-01-11' },
      { user_id: 9, checkin_date: '2026-01-12' },
      { user_id: 9, checkin_date: '2026-01-13' },
      { user_id: 9, checkin_date: '2026-01-14' },
      { user_id: 9, checkin_date: '2026-01-15' },

      // User ID 10 - 20 hari puasa
      { user_id: 10, checkin_date: '2026-01-01' },
      { user_id: 10, checkin_date: '2026-01-02' },
      { user_id: 10, checkin_date: '2026-01-03' },
      { user_id: 10, checkin_date: '2026-01-04' },
      { user_id: 10, checkin_date: '2026-01-05' },
      { user_id: 10, checkin_date: '2026-01-06' },
      { user_id: 10, checkin_date: '2026-01-07' },
      { user_id: 10, checkin_date: '2026-01-08' },
      { user_id: 10, checkin_date: '2026-01-09' },
      { user_id: 10, checkin_date: '2026-01-10' },
      { user_id: 10, checkin_date: '2026-01-11' },
      { user_id: 10, checkin_date: '2026-01-12' },
      { user_id: 10, checkin_date: '2026-01-13' },
      { user_id: 10, checkin_date: '2026-01-14' },
      { user_id: 10, checkin_date: '2026-01-15' },
      { user_id: 10, checkin_date: '2026-01-16' },
      { user_id: 10, checkin_date: '2026-01-17' },
      { user_id: 10, checkin_date: '2026-01-18' },
      { user_id: 10, checkin_date: '2026-01-19' },
      { user_id: 10, checkin_date: '2026-01-20' },
      { user_id: 12, checkin_date: '2026-01-01' },
      { user_id: 12, checkin_date: '2026-01-02' },
      { user_id: 12, checkin_date: '2026-01-03' },
      { user_id: 12, checkin_date: '2026-01-04' },
      { user_id: 12, checkin_date: '2026-01-05' },
      { user_id: 12, checkin_date: '2026-01-06' },
      { user_id: 12, checkin_date: '2026-01-07' },
      { user_id: 12, checkin_date: '2026-01-08' },
      { user_id: 12, checkin_date: '2026-01-09' },
      { user_id: 12, checkin_date: '2026-01-10' },
      { user_id: 12, checkin_date: '2026-01-11' },
      { user_id: 12, checkin_date: '2026-01-12' },
      { user_id: 12, checkin_date: '2026-01-13' },
      { user_id: 12, checkin_date: '2026-01-14' },
      { user_id: 12, checkin_date: '2026-01-15' },
      { user_id: 12, checkin_date: '2026-01-16' },
      { user_id: 12, checkin_date: '2026-01-17' },
      { user_id: 12, checkin_date: '2026-01-18' },
      { user_id: 12, checkin_date: '2026-01-19' },
      { user_id: 12, checkin_date: '2026-01-20' },
      { user_id: 12, checkin_date: '2026-01-21' },
      { user_id: 12, checkin_date: '2026-01-22' },
    ]

    // Insert data
    await db.table('ramadan_checkins').multiInsert(checkinData)

    // ✅ Insert sample data untuk ramadan_checkin_exemptions
    const exemptionData = [
      // User ID 9 - 2 hari tidak puasa
      { user_id: 9, exempt_date: '2026-01-18', reason: 'Sakit' },
      { user_id: 9, exempt_date: '2026-01-19', reason: 'Perjalanan' },

      // User ID 10 - 5 hari tidak puasa
      { user_id: 10, exempt_date: '2026-01-21', reason: 'Sakit' },
      { user_id: 10, exempt_date: '2026-01-22', reason: 'Sakit' },
      { user_id: 10, exempt_date: '2026-01-23', reason: 'Perjalanan' },
      { user_id: 10, exempt_date: '2026-01-24', reason: 'Perjalanan' },
      { user_id: 10, exempt_date: '2026-01-25', reason: 'Alasan Pribadi' },
    ]

    // Insert data
    await db.table('ramadan_checkin_exemptions').multiInsert(exemptionData)

    console.log('✅ Ramadan seeder data berhasil diinsert!')
  }
}
