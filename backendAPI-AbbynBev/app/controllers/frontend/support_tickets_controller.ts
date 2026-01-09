import type { HttpContext } from '@adonisjs/core/http'
import SupportTicket from '#models/support_ticket'
import {
  createSupportTicketGuestValidator,
  createSupportTicketAuthValidator,
} from '#validators/support_ticket'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class SupportTicketsController {
  public async create({ request, response, auth }: HttpContext) {
    try {
      const isLoggedIn = await auth.check()
      let payload
      let ticket: SupportTicket

      if (isLoggedIn) {
        payload = await request.validateUsing(createSupportTicketAuthValidator)

        ticket = await SupportTicket.create({
          userId: auth.user!.id,
          name: auth.user!.name || auth.user!.email,
          email: auth.user!.email,
          phone: auth.user!.phoneNumber || auth.user!.phone || '',
          subject: payload.subject,
          message: payload.message,
        })
      } else {
        payload = await request.validateUsing(createSupportTicketGuestValidator)

        ticket = await SupportTicket.create({
          ...payload,
          userId: null,
        })
      }

      await mail.send((message) => {
        message
          .from(env.get('DEFAULT_FROM_EMAIL') as string)
          .to(ticket.email)
          .subject('[Abby n Bev] Terima Kasih atas Laporan Kamu 💖')
          .htmlView('emails/support_ticket', {
            name: ticket.name,
            subject: ticket.subject,
            message: ticket.message,
            currentYear: new Date().getFullYear(),
          })
      })

      return response.created({
        message: 'Support ticket berhasil dibuat',
        serve: ticket,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }
}
