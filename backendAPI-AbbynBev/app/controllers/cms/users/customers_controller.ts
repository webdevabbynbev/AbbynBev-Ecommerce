import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { Role } from '../../../enums/role.js'

export default class CustomersController {
  public async getCustomers({ response, request }: HttpContext) {
    try {
      const qs = request.qs()
      const search = qs.q ?? ''
      const page = Number.isNaN(Number.parseInt(qs.page)) ? 1 : Number.parseInt(qs.page)
      const perPage = Number.isNaN(Number.parseInt(qs.per_page)) ? 10 : Number.parseInt(qs.per_page)

      const guestRole = Role?.GUEST ?? 2

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .where('role', guestRole)
        .if(search, (q) =>
          q.where('firstName', 'like', `%${search}%`).orWhere('lastName', 'like', `%${search}%`)
        )
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      const meta = users.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: { data: users.toJSON().data, ...meta },
      })
    } catch (error) {
      return response.status(500).send({ message: 'Internal server error.', serve: [] })
    }
  }
}
