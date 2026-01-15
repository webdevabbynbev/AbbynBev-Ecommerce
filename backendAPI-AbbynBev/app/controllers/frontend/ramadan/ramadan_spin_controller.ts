import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import RamadanCheckin from '#models/ramadan_checkin'
import RamadanSpinPrize from '#models/ramadan_spin_prize'
import RamadanSpinTransaction from '#models/ramadan_spin_transaction'
import RamadanSpinTicket from '#models/ramadan_spin_ticket'

const FASTING_TICKET_THRESHOLD = 23

export default class RamadanSpinController {
  private async getTicketCount(userId: number) {
    const fastingCountResult = await RamadanCheckin.query()
      .where('user_id', userId)
      .count('* as total')

    const fastingCount = Number(fastingCountResult[0]?.$extras?.total || 0)
    const ticketRecord = await RamadanSpinTicket.query().where('user_id', userId).first()
    const earnedTickets = Number(ticketRecord?.tickets || 0)
    const usedSpinResult = await RamadanSpinTransaction.query()
      .where('user_id', userId)
      .count('* as total')

    const usedSpins = Number(usedSpinResult[0]?.$extras?.total || 0)

    return {
      fastingCount,
      earnedTickets,
      usedSpins,
      remainingTickets: Math.max(0, earnedTickets - usedSpins),
    }
  }

  public async status({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'Unauthorized', serve: null })

    const ticketInfo = await this.getTicketCount(user.id)
    const prizes = await RamadanSpinPrize.query()
      .where('is_active', true)
      .orderBy('created_at', 'desc')

    return response.ok({
      message: 'success',
      serve: {
        tickets: ticketInfo.remainingTickets,
        fasting_days: ticketInfo.fastingCount,
        prizes,
      },
    })
  }
  public async claimTicket({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'Unauthorized', serve: null })

    const ticketInfo = await this.getTicketCount(user.id)
    if (ticketInfo.fastingCount < FASTING_TICKET_THRESHOLD) {
      return response.badRequest({
        message: 'Minimal puasa 23 hari untuk klaim tiket spin.',
        serve: null,
      })
    }

    if (ticketInfo.earnedTickets >= 1) {
      return response.badRequest({
        message: 'Ticket spin sudah diklaim.',
        serve: null,
      })
    }

    await RamadanSpinTicket.updateOrCreate(
      { userId: user.id },
      {
        userId: user.id,
        tickets: 1,
      }
    )

    const updated = await this.getTicketCount(user.id)

    return response.ok({
      message: 'Ticket spin berhasil diklaim.',
      serve: {
        tickets: updated.remainingTickets,
        remaining_tickets: updated.remainingTickets,
        fasting_days: updated.fastingCount,
      },
    })
  }
  private pickPrize(prizes: RamadanSpinPrize[]) {
    const weighted = prizes.filter((prize) => Number(prize.weight) > 0)
    const totalWeight = weighted.reduce((sum, prize) => sum + Number(prize.weight), 0)
    if (totalWeight <= 0) return null

    const roll = Math.random() * totalWeight
    let cumulative = 0
    for (const prize of weighted) {
      cumulative += Number(prize.weight)
      if (roll <= cumulative) return prize
    }

    return weighted[weighted.length - 1] || null
  }

  public async spin({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'Unauthorized', serve: null })

    const ticketInfo = await this.getTicketCount(user.id)
    if (ticketInfo.remainingTickets <= 0) {
      return response.badRequest({ message: 'Ticket spin tidak tersedia.' })
    }

    const prizes = await RamadanSpinPrize.query().where('is_active', true)
    if (prizes.length === 0) {
      return response.badRequest({ message: 'Hadiah spin belum tersedia.' })
    }

    const startOfDay = DateTime.now().setZone('Asia/Jakarta').startOf('day').toSQL()
    const endOfDay = DateTime.now().setZone('Asia/Jakarta').endOf('day').toSQL()

    const prizeIds = prizes.map((prize) => prize.id)
    const dailyCounts = await db
      .from('ramadan_spin_transactions')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .whereIn('prize_id', prizeIds)
      .groupBy('prize_id')
      .select('prize_id')
      .count('* as total')

    const dailyMap = new Map<number, number>()
    dailyCounts.forEach((row) => {
      dailyMap.set(Number(row.prize_id), Number(row.total || 0))
    })

    const availablePrizes = prizes.filter((prize) => {
      if (prize.dailyQuota === null || prize.dailyQuota === undefined) return true
      const used = dailyMap.get(prize.id) ?? 0
      return used < Number(prize.dailyQuota)
    })

    if (availablePrizes.length === 0) {
      return response.badRequest({ message: 'Hadiah tidak tersedia.' })
    }
    const chosen = this.pickPrize(availablePrizes)
    if (!chosen) return response.badRequest({ message: 'Hadiah tidak tersedia.' })

    const transaction = await db.transaction(async (trx) => {
      const createdTransaction = await RamadanSpinTransaction.create(
        {
          userId: user.id,
          prizeId: chosen.id,
        },
        { client: trx }
      )

      // Kurangi dailyQuota jika hadiah memiliki quota
      if (chosen.dailyQuota !== null && Number(chosen.dailyQuota) > 0) {
        const updatedPrize = await RamadanSpinPrize.query({ client: trx })
          .where('id', chosen.id)
          .forUpdate()
          .first()

        if (updatedPrize) {
          const newQuota = Math.max(0, Number(updatedPrize.dailyQuota || 0) - 1)
          updatedPrize.dailyQuota = newQuota
          await updatedPrize.useTransaction(trx).save()
        }
      }

      return createdTransaction
    })

    return response.ok({
      message: 'Spin berhasil.',
      serve: {
        prize: chosen,
        transaction_id: transaction.id,
        remaining_tickets: Math.max(0, ticketInfo.remainingTickets - 1),
      },
    })
  }
}
