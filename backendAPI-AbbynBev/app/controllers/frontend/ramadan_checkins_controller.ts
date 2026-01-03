import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import RamadanCheckin from '#models/ramadan_checkin'
import RamadanCheckinExemption from '#models/ramadan_checkin_exemption'
import env from '#start/env'

const TOTAL_DAYS = 30

function todayDateString() {
  const now = DateTime.now().plus({ hours: 7 })
  return now.toISODate()
}

function resolveCheckinDate(inputDate?: string) {
  if (!inputDate) return todayDateString()
  const parsed = DateTime.fromISO(inputDate)
  if (!parsed.isValid) return null
  return parsed.toISODate()
}

export default class RamadanCheckinsController {
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

      const checkedDates = checkins
        .map((row) => row.checkinDate?.toISODate())
        .filter((date): date is string => Boolean(date))

      const exemptDates = exemptions
        .map((row) => ({
          date: row.exemptDate?.toISODate(),
          reason: row.reason,
        }))
        .filter((row): row is { date: string; reason: string } => Boolean(row.date))

      const today = todayDateString()
      const checkedCount = checkedDates.length
      const exemptCount = exemptDates.length

      return response.status(200).send({
        message: 'success',
        serve: {
          total_days: TOTAL_DAYS,
          checked_count: checkedCount,
          exempt_count: exemptCount,
          checked_dates: checkedDates,
          exempt_dates: exemptDates,
          has_checked_today: checkedDates.includes(today),
          has_exempt_today: exemptDates.some((row) => row.date === today),
          reward_eligible: checkedCount + exemptCount >= TOTAL_DAYS,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async checkin({ response, auth, request }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const requestedDate = resolveCheckinDate(String(request.input('date') || ''))
      if (!requestedDate) {
        return response.status(400).send({ message: 'Tanggal tidak valid.', serve: null })
      }
      const today = requestedDate
      const allowMulti = env.get('ALLOW_MULTIPLE_RAMADAN_CHECKINS') === 'true'

      const exempt = allowMulti
        ? null
        : await RamadanCheckinExemption.query()
            .where('user_id', user.id)
            .where('exempt_date', today)
            .first()

      if (exempt) {
        return response.status(400).send({
          message: 'Hari ini sudah di-exempt.',
          serve: null,
        })
      }

      const already = allowMulti
        ? null
        : await RamadanCheckin.query()
            .where('user_id', user.id)
            .where('checkin_date', today)
            .first()

      if (already) {
        return response.status(400).send({
          message: 'Sudah check-in hari ini.',
          serve: null,
        })
      }

      await RamadanCheckin.create({
        userId: user.id,
        checkinDate: DateTime.fromISO(today),
      })

      const checkedCount = await RamadanCheckin.query()
        .where('user_id', user.id)
        .count('* as total')
      const exemptCount = await RamadanCheckinExemption.query()
        .where('user_id', user.id)
        .count('* as total')

      const total = Number(checkedCount[0]?.$extras?.total || 0)
      const exemptTotal = Number(exemptCount[0]?.$extras?.total || 0)

      return response.status(200).send({
        message: 'Check-in berhasil.',
        serve: {
          checked_count: total,
          exempt_count: exemptTotal,
          reward_eligible: total + exemptTotal >= TOTAL_DAYS,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async exempt({ response, auth, request }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const requestedDate = resolveCheckinDate(String(request.input('date') || ''))
      if (!requestedDate) {
        return response.status(400).send({ message: 'Tanggal tidak valid.', serve: null })
      }
      const today = requestedDate
      const reason = String(request.input('reason') || '').trim()
      const allowMulti = env.get('ALLOW_MULTIPLE_RAMADAN_CHECKINS') === 'true'

      if (!reason) {
        return response.status(400).send({
          message: 'Alasan wajib diisi.',
          serve: null,
        })
      }

      const alreadyCheckin = allowMulti
        ? null
        : await RamadanCheckin.query()
            .where('user_id', user.id)
            .where('checkin_date', today)
            .first()

      if (alreadyCheckin) {
        return response.status(400).send({
          message: 'Hari ini sudah check-in.',
          serve: null,
        })
      }

      const alreadyExempt = allowMulti
        ? null
        : await RamadanCheckinExemption.query()
            .where('user_id', user.id)
            .where('exempt_date', today)
            .first()

      if (alreadyExempt) {
        return response.status(400).send({
          message: 'Hari ini sudah di-exempt.',
          serve: null,
        })
      }

      await RamadanCheckinExemption.create({
        userId: user.id,
        exemptDate: DateTime.fromISO(today),
        reason,
      })

      const checkedCount = await RamadanCheckin.query()
        .where('user_id', user.id)
        .count('* as total')
      const exemptCount = await RamadanCheckinExemption.query()
        .where('user_id', user.id)
        .count('* as total')

      const total = Number(checkedCount[0]?.$extras?.total || 0)
      const exemptTotal = Number(exemptCount[0]?.$extras?.total || 0)

      return response.status(200).send({
        message: 'Exempt berhasil disimpan.',
        serve: {
          checked_count: total,
          exempt_count: exemptTotal,
          reward_eligible: total + exemptTotal >= TOTAL_DAYS,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }
}