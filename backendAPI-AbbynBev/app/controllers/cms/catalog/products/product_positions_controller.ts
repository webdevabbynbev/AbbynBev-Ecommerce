import type { HttpContext } from '@adonisjs/core/http'
import { ProductCmsService } from '#services/product/product_cms_service'

export default class ProductPositionsController {
  private cms = new ProductCmsService()

  public async updateProductIndex({ request, response }: HttpContext) {
    try {
      const updates = request.input('updates') || []
      await this.cms.updatePositions(updates)

      return response.status(200).send({
        message: 'Positions updated and reordered successfully.',
        serve: [],
      })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }
}
