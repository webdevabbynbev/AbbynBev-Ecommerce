import type { HttpContext } from '@adonisjs/core/http'
import { ProductService } from '#services/product/product_service'

export default class ProductFlashsaleController {
  private productService = new ProductService()

  public async getIsFlashsale({ response }: HttpContext) {
    try {
      const dataProduct = await this.productService
        .query()
        .apply((scopes) => scopes.active())
        .where('is_flashsale', true)
        .where('status', '!=', 'draft')
        .orderBy('products.created_at', 'desc')

      return response.status(200).send({
        message: 'success',
        serve: dataProduct.map((p) => p.toJSON()),
      })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }
}