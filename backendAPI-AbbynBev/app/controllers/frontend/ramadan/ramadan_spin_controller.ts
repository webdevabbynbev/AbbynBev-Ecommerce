import type { HttpContext } from '@adonisjs/core/http'
import RamadanCheckin from '#models/ramadan_checkin'
import RamadanSpinPrize from '#models/ramadan_spin_prize'
import RamadanSpinTransaction from '#models/ramadan_spin_transaction'

const FASTING_TICKET_THRESHOLD = 23
const GRAND_PRIZE_LIMIT = 10

export default class RamadanSpinController {
  private async getTicketCount(userId: number) {
    const fastingCountResult = await RamadanCheckin.query()
      .where('user_id', userId)
      .count('* as total')

    const fastingCount = Number(fastingCountResult[0]?.$extras?.total || 0)
    const usedSpinResult = await RamadanSpinTransaction.query()
      .where('user_id', userId)
      .count('* as total')

    const usedSpins = Number(usedSpinResult[0]?.$extras?.total || 0)
    const earnedTickets = fastingCount >= FASTING_TICKET_THRESHOLD ? 1 : 0

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

    const grandPrizeCountResult = await RamadanSpinTransaction.query()
      .whereHas('prize', (query) => {
        query.where('is_grand', true)
      })
      .count('* as total')

    const grandPrizeCount = Number(grandPrizeCountResult[0]?.$extras?.total || 0)

    let chosen = this.pickPrize(prizes)
    if (!chosen) return response.badRequest({ message: 'Hadiah tidak tersedia.' })

    if (chosen.isGrand && grandPrizeCount >= GRAND_PRIZE_LIMIT) {
      const nonGrand = prizes.filter((prize) => !prize.isGrand)
      chosen = this.pickPrize(nonGrand)
      if (!chosen) {
        return response.badRequest({ message: 'Hadiah utama sudah habis.' })
      }
    }

    const transaction = await RamadanSpinTransaction.create({
      userId: user.id,
      prizeId: chosen.id,
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
