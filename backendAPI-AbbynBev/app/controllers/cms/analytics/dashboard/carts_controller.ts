import type { HttpContext } from '@adonisjs/core/http'
import { DashboardCartsService } from '#services/cms/dashboard/dashboard_carts_service'

export default class DashboardCartsController {
  private svc = new DashboardCartsService()

  public async getUserCart({ response, request }: HttpContext) {
    const data = await this.svc.getUserCarts(request.qs())
    return response.ok({ message: 'Success', serve: data })
  }
}
