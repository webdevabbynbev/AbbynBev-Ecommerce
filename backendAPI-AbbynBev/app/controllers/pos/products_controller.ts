import type { HttpContext } from '@adonisjs/core/http'
import ProductVariant from '#models/product_variant'

export default class productsController {
  public async scanByBarcode({ request, response }: HttpContext) {
    try {
      const barcode = request.input('barcode')
      if (!barcode) {
        return response.status(400).send({
          message: 'Barcode is required',
          serve: null,
        })
      }

      const variant = await ProductVariant.query()
        .where('barcode', barcode)
        .preload('product', (q) => q.preload('brand'))
        .first()

      if (!variant) {
        return response.status(404).send({
          message: 'Product not found for this barcode',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'success',
        serve: variant,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
