import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Role } from '../enums/role.js'

export default class RolePermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, roles: Role[]) {
    if (!ctx.auth?.user?.role) {
      return ctx.response.status(403).send({ message: 'Forbidden Resource' })
    }

    const userRole = Number(ctx.auth.user.role) // Konversi ke number

    if (!roles.includes(userRole) && userRole !== Role.ADMINISTRATOR) {
      return ctx.response.status(403).send({ message: 'Forbidden Resource' })
    }

    return await next()
  }
}
