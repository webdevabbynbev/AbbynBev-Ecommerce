import type { HttpContext } from '@adonisjs/core/http'
import Persona from '#models/persona'

export default class FePersonasController {
  public async list({ response }: HttpContext) {
    try {
      const personas = await Persona.query().whereNull('deleted_at')

      return response.ok({
        message: 'Success',
        serve: personas,
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

      const persona = await Persona.query()
        .where('slug', slug)
        .whereNull('deleted_at')
        .preload('products', (q) => {
          q.apply((scopes) => scopes.active())
            .join('product_onlines', 'product_onlines.product_id', '=', 'products.id')
            .where('product_onlines.is_active', true)
            .preload('medias')
            .preload('categoryType')
        })
        .first()

      if (!persona) {
        return response.notFound({
          message: 'Persona not found',
          serve: null,
        })
      }

      return response.ok({
        message: 'Success',
        serve: persona,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
