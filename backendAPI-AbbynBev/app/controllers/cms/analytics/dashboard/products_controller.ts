import type { HttpContext } from '@adonisjs/core/http'
import { DashboardProductsService } from '#services/cms/dashboard/dashboard_products_service'

export default class ProductsController {
  private service = new DashboardProductsService()

  public async getTopProductSell({ response }: HttpContext) {
    const data = await this.service.topProductSell(5)
    return response.ok({ message: 'Success', serve: data })
  }

  public async getLessProductSell({ response }: HttpContext) {
    const data = await this.service.lessProductSell(5)
    return response.ok({ message: 'Success', serve: data })
  }
}
