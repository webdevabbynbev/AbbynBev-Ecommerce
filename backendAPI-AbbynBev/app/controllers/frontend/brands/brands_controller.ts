import type { HttpContext } from '@adonisjs/core/http'
import Brand from '#models/brand'

export default class BrandsController {
  public async list({ response, request }: HttpContext) {
    try {
      const letter = request.input('letter')
      const allBrands = await Brand.query()
        .whereNull('deleted_at')
        .andWhere('is_active', 1)
        .orderBy('name', 'asc')

      const filteredBrands =
        letter && letter !== '#'
          ? allBrands.filter((b) => b.name.charAt(0).toUpperCase() === letter.toUpperCase())
          : allBrands

      const grouped = filteredBrands.reduce((acc: Record<string, any[]>, brand) => {
        const l = brand.name.charAt(0).toUpperCase()
        if (!acc[l]) acc[l] = []
        acc[l].push(brand)
        return acc
      }, {})

      const result = Object.keys(grouped)
        .sort()
        .map((letter) => ({
          letter,
          children: grouped[letter],
        }))

      return response.status(200).send({
        message: 'Success',
        serve: result,
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

      const brand = await Brand.query()
        .where('slug', slug)
        .whereNull('deleted_at')
        .andWhere('is_active', 1)
        .preload('products', (q) => {
          q.apply((scopes) => scopes.active())
            .join('product_onlines', 'product_onlines.product_id', '=', 'products.id')
            .where('product_onlines.is_active', true)
            .preload('medias')
            .preload('categoryType')
            .preload('persona')
        })
        .first()

      if (!brand) {
        return response.status(404).send({
          message: 'Brand not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: brand,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
