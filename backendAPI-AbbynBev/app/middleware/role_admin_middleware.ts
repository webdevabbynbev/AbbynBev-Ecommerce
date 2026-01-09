import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Role } from '../enums/role.js'

export default class RoleAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.authenticate()

    const userRole = Number(ctx.auth.user?.role)

    if (userRole !== Role.ADMINISTRATOR) {
      return ctx.response.status(403).send({ message: 'Forbidden Resource' })
    }

    return await next()
  }
}
