import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class OptionalAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    try {
      await ctx.auth.check()
    } catch (e) {}

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
