import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const AUTH_COOKIE_NAME = 'auth_token'

export default class AuthCookieMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const existing = request.header('authorization')
    if (!existing) {
      const token = request.cookie(AUTH_COOKIE_NAME)
      if (token) {
        ;(request.request.headers as any)['authorization'] = `Bearer ${token}`
      }
    }

    await next()
  }
}
