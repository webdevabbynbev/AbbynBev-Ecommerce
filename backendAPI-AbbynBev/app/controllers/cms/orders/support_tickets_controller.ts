import type { HttpContext } from '@adonisjs/core/http'
import SupportTicket from '#models/support_ticket'
import { updateSupportTicketValidator } from '#validators/support_ticket'
import db from '@adonisjs/lucid/services/db'

export default class SupportTicketsController {
  public async get({ request, response }: HttpContext) {
    try {
      const { page = 1, per_page = 10, status } = request.qs()

      const ticketsQuery = SupportTicket.query()
        .if(status, (q) => q.where('status', status))
        .preload('user', (q) => q.select(['id', 'first_name', 'last_name', 'email']))
        .orderBy('created_at', 'desc')
        .paginate(Number(page), Number(per_page))

      const { meta, data } = (await ticketsQuery).toJSON()

      if (data.length === 0) {
        return response.status(200).send({
          message: 'Tidak ada data support ticket.',
          serve: {
            data: [],
            ...meta,
          },
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: {
          data,
          ...meta,
        },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const ticket = await SupportTicket.query()
        .where('id', params.id)
        .preload('user', (q) => q.select(['id', 'first_name', 'last_name', 'email']))
        .first()

      if (!ticket) {
        return response.status(404).send({
          message: 'Support ticket tidak ditemukan.',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: ticket,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async update({ request, params, response }: HttpContext) {
    const trx = await db.transaction()
    try {
      const payload = await request.validateUsing(updateSupportTicketValidator)

      const ticket = await SupportTicket.query().where('id', params.id).first()

      if (!ticket) {
        await trx.commit()
        return response.status(404).send({
          message: 'Support ticket tidak ditemukan.',
          serve: null,
        })
      }

      ticket.useTransaction(trx)
      ticket.status = payload.status
      await ticket.save()

      await trx.commit()
      return response.status(200).send({
        message: 'Support ticket status updated successfully.',
        serve: ticket,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }
}
