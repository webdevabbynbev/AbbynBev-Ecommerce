import type { HttpContext } from '@adonisjs/core/http'
import ProductOnline from '#models/product_online'

export default class ProductOnlinesController {
  public async get({ response }: HttpContext) {
    try {
      const data = await ProductOnline.query()
        .where('is_active', true)
        .preload('product', (p) => {
          p.preload('variants').preload('brand').preload('categoryType').preload('persona')
        })

      return response.status(200).send({
        message: 'success',
        serve: data,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const data = await ProductOnline.query()
        .where('id', params.id)
        .preload('product', (p) => {
          p.preload('variants').preload('brand').preload('categoryType').preload('persona')
        })
        .first()

      if (!data) {
        return response.status(404).send({
          message: 'Product not found',
        })
      }

      return response.status(200).send({
        message: 'success',
        serve: data,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }
}
