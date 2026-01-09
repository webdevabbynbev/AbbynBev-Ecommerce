import type { HttpContext } from '@adonisjs/core/http'
import ConcernOption from '#models/concern_option'

export default class ConcernsController {
  public async list({ response }: HttpContext) {
    try {
      const concerns = await ConcernOption.query().whereNull('concern_options.deleted_at')

      return response.ok({
        message: 'Success',
        serve: concerns,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const { slug } = params

      const concernOption = await ConcernOption.query()
        .where('concern_options.slug', slug)
        .whereNull('concern_options.deleted_at')
        .preload('products', (q) => {
          q.apply((scopes) => scopes.active())
            .join('product_onlines', 'product_onlines.product_id', '=', 'products.id')
            .where('product_onlines.is_active', true)
            .whereNull('products.deleted_at')
            .preload('medias')
            .preload('brand')
            .preload('categoryType')
            .preload('persona')
        })
        .first()

      if (!concernOption) {
        return response.notFound({
          message: 'Concern option not found',
          serve: null,
        })
      }

      return response.ok({
        message: 'Success',
        serve: concernOption,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
