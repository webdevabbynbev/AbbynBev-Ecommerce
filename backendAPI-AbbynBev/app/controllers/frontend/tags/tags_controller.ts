import type { HttpContext } from '@adonisjs/core/http'
import Tag from '#models/tag'

export default class TagsController {
  public async list({ response }: HttpContext) {
    try {
      const tags = await Tag.query().whereNull('tags.deleted_at')

      return response.ok({
        message: 'Success',
        serve: tags,
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

      const tag = await Tag.query()
        .where('tags.slug', slug)
        .whereNull('tags.deleted_at')
        .preload('products', (q) => {
          q.apply((scopes) => scopes.active())
            .join('product_onlines', 'product_onlines.product_id', '=', 'products.id')
            .where('product_onlines.is_active', true)
            .whereNull('products.deleted_at')
            .wherePivot('deleted_at', null as any)
            .preload('medias')
            .preload('brand')
            .preload('categoryType')
            .preload('persona')
        })
        .first()

      if (!tag) {
        return response.notFound({
          message: 'Tag not found',
          serve: null,
        })
      }

      return response.ok({
        message: 'Success',
        serve: tag,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
