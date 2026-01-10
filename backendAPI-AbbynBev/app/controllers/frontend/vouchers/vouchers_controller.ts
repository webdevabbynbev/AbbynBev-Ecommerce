import type { HttpContext } from '@adonisjs/core/http'
import Voucher from '#models/voucher'

export default class VouchersController {
  public async validate({ response, request }: HttpContext) {
    try {
      const now = new Date()
      now.setHours(now.getHours() + 7)
      const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

      const vouchers = await Voucher.query()
        .apply((query) => query.active())
        .where('code', request.input('code'))
        .where('started_at', '<=', dateString)
        .where('expired_at', '>=', dateString)
        .where('is_active', 1)
        .where('qty', '>', 0)
        .first()
      if (!vouchers) {
        return response.status(400).send({
          message: 'Voucher not valid.',
          serve: null,
        })
      }
      return response.status(200).send({
        message: '',
        serve: vouchers,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
