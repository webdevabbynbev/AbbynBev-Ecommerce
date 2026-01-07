import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import RamadanCheckin from '#models/ramadan_checkin'
import RamadanCheckinExemption from '#models/ramadan_checkin_exemption'
import env from '#start/env'

const TOTAL_DAYS = 30
const MAX_EXEMPT_DAYS = 7 // Batas maksimal tidak puasa

function getJakartaTime() {
  return DateTime.now().setZone('Asia/Jakarta')
}

function todayDateString() {
  return getJakartaTime().toISODate()
}

function resolveCheckinDate(inputDate?: string) {
  if (!inputDate) return todayDateString()
  const parsed = DateTime.fromISO(inputDate)
  if (!parsed.isValid) return null
  return parsed.toISODate()
}

export default class RamadanCheckinsController {
  // --- STATUS ---
  public async status({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const checkins = await RamadanCheckin.query()
        .where('user_id', user.id)
        .orderBy('checkin_date', 'asc')

      const exemptions = await RamadanCheckinExemption.query()
        .where('user_id', user.id)
        .orderBy('exempt_date', 'asc')

      const checkedData = checkins
        .map((row) => ({
          date: row.checkinDate?.toISODate(),
          time: row.createdAt
            ? row.createdAt.setZone('Asia/Jakarta').toFormat('HH:mm')
            : row.checkinDate
              ? row.checkinDate.setZone('Asia/Jakarta').toFormat('HH:mm')
              : '-',
        }))
        .filter((item): item is { date: string; time: string } => Boolean(item.date))

      const checkedDates = checkedData.map((d) => d.date)

      const exemptDates = exemptions
        .map((row) => ({
          date: row.exemptDate?.toISODate(),
          reason: row.reason,
        }))
        .filter((row): row is { date: string; reason: string } => Boolean(row.date))

      const today = todayDateString()
      const checkedCount = checkedDates.length
      const exemptCount = exemptDates.length

      const totalProgress = checkedCount + exemptCount

      // [LOGIC BARU]
      // Eligible jika:
      // 1. Total hari (Puasa + Tidak Puasa) >= 30
      // 2. DAN Jumlah Tidak Puasa < 21
      const isEligible = totalProgress >= TOTAL_DAYS && exemptCount < MAX_EXEMPT_DAYS

      return response.status(200).send({
        message: 'success',
        serve: {
          total_days: TOTAL_DAYS,
          checked_count: checkedCount,
          exempt_count: exemptCount,
          checked_dates: checkedDates,
          checked_data: checkedData,
          exempt_dates: exemptDates,
          has_checked_today: checkedDates.includes(today!),
          has_exempt_today: exemptDates.some((row) => row.date === today),
          reward_eligible: isEligible, // Gunakan variabel hasil logic baru
        },
      })
    } catch (error: any) {
      return response
        .status(500)
        .send({ message: error.message || 'Internal Server Error.', serve: null })
    }
  }

  // --- CHECKIN ---
  public async checkin({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const nowJakarta = getJakartaTime()
      const currentHour = nowJakarta.hour
      const today = nowJakarta.toISODate()

      if (currentHour < 6 || currentHour >= 18) {
        return response.status(400).send({
          message: 'Check-in ditutup. Silakan kembali antara pukul 06:00 - 18:00.',
          serve: null,
        })
      }

      if (!today) return response.status(500).send({ message: 'Server Time Error', serve: null })

      const allowMulti = env.get('ALLOW_MULTIPLE_RAMADAN_CHECKINS') === 'true'

      const exempt = allowMulti
        ? null
        : await RamadanCheckinExemption.query()
            .where('user_id', user.id)
            .where('exempt_date', today)
            .first()
      if (exempt)
        return response
          .status(400)
          .send({ message: 'Anda sudah melakukan Exempt hari ini.', serve: null })

      const already = allowMulti
        ? null
        : await RamadanCheckin.query()
            .where('user_id', user.id)
            .where('checkin_date', today)
            .first()
      if (already)
        return response.status(400).send({ message: 'Sudah check-in hari ini.', serve: null })

      await RamadanCheckin.create({
        userId: user.id,
        checkinDate: DateTime.fromISO(today),
      })

      // Hitung ulang untuk logic realtime
      const updatedCheckins = await RamadanCheckin.query()
        .where('user_id', user.id)
        .count('* as total')
      const updatedExempts = await RamadanCheckinExemption.query()
        .where('user_id', user.id)
        .count('* as total')

      const totalCheck = Number(updatedCheckins[0]?.$extras?.total || 0)
      const totalExempt = Number(updatedExempts[0]?.$extras?.total || 0)
      const totalProgress = totalCheck + totalExempt

      // [LOGIC BARU SAMA SEPERTI DIATAS]
      const isEligible = totalProgress >= TOTAL_DAYS && totalExempt < MAX_EXEMPT_DAYS

      return response.status(200).send({
        message: 'Check-in berhasil.',
        serve: {
          checked_count: totalCheck,
          exempt_count: totalExempt,
          reward_eligible: isEligible,
        },
      })
    } catch (error: any) {
      return response
        .status(500)
        .send({ message: error.message || 'Internal Server Error.', serve: null })
    }
  }

  // --- EXEMPT ---
  public async exempt({ response, auth, request }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const nowJakarta = getJakartaTime()
      const today = nowJakarta.toISODate()

      if (!today) return response.status(500).send({ message: 'Server Time Error', serve: null })

      const reason = String(request.input('reason') || '').trim()
      const allowMulti = env.get('ALLOW_MULTIPLE_RAMADAN_CHECKINS') === 'true'

      if (!reason) return response.status(400).send({ message: 'Alasan wajib diisi.', serve: null })

      const alreadyCheckin = allowMulti
        ? null
        : await RamadanCheckin.query()
            .where('user_id', user.id)
            .where('checkin_date', today)
            .first()
      if (alreadyCheckin)
        return response.status(400).send({ message: 'Hari ini sudah check-in.', serve: null })

      const alreadyExempt = allowMulti
        ? null
        : await RamadanCheckinExemption.query()
            .where('user_id', user.id)
            .where('exempt_date', today)
            .first()
      if (alreadyExempt)
        return response.status(400).send({ message: 'Hari ini sudah di-exempt.', serve: null })

      await RamadanCheckinExemption.create({
        userId: user.id,
        exemptDate: DateTime.fromISO(today),
        reason,
      })

      const updatedCheckins = await RamadanCheckin.query()
        .where('user_id', user.id)
        .count('* as total')
      const updatedExempts = await RamadanCheckinExemption.query()
        .where('user_id', user.id)
        .count('* as total')

      const totalCheck = Number(updatedCheckins[0]?.$extras?.total || 0)
      const totalExempt = Number(updatedExempts[0]?.$extras?.total || 0)
      const totalProgress = totalCheck + totalExempt

      // [LOGIC BARU SAMA SEPERTI DIATAS]
      const isEligible = totalProgress >= TOTAL_DAYS && totalExempt < MAX_EXEMPT_DAYS

      return response.status(200).send({
        message: 'Exempt berhasil disimpan.',
        serve: {
          checked_count: totalCheck,
          exempt_count: totalExempt,
          reward_eligible: isEligible,
        },
      })
    } catch (error: any) {
      return response
        .status(500)
        .send({ message: error.message || 'Internal Server Error.', serve: null })
    }
  }
}
