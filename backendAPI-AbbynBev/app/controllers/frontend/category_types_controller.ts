import type { HttpContext } from '@adonisjs/core/http'
import CategoryType from '#models/category_type'

export default class CategoryTypesController {
  public async list({ response }: HttpContext) {
    try {
      const categories = await CategoryType.query()
        .apply((query) => query.active())
        .whereNull('parent_id')
        .preload('children', (q) => {
          q.apply((query) => query.active()).preload('children', (qq) => {
            qq.apply((query) => query.active())
          })
        })

      return response.status(200).send({
        message: 'Success',
        serve: categories,
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

      const category = await CategoryType.query()
        .apply((query) => query.active())
        .where('slug', slug)
        .preload('children', (q) => {
          q.apply((query) => query.active())
        })
        .first()

      if (!category) {
        return response.status(404).send({
          message: 'Category not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: category,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
