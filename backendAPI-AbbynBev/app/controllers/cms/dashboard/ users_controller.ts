import type { HttpContext } from '@adonisjs/core/http'
import { DashboardUsersService } from '#services/cms/dashboard/dashboard_users_service'

export default class DashboardUsersController {
  private svc = new DashboardUsersService()

  public async getTotalRegisterUser({ response }: HttpContext) {
    const total = await this.svc.totalRegisteredActiveUsers()
    return response.status(200).send({ message: 'Success', serve: { total } })
  }

  public async getTotalRegisterUserByPeriod({ response }: HttpContext) {
    const data = await this.svc.registeredUsersByPeriod()
    return response.status(200).send({ message: 'Success', serve: data })
  }
}
