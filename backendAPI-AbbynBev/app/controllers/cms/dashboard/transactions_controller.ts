import type { HttpContext } from '@adonisjs/core/http'
import { DashboardTransactionsService } from '#services/cms/dashboard/dashboard_transactions_service'

export default class DashboardTransactionsController {
  private svc = new DashboardTransactionsService()

  public async getTotalTransaction({ response }: HttpContext) {
    const total = await this.svc.totalCompletedTransactions()
    return response.status(200).send({ message: 'Success', serve: { total } })
  }

  public async getTotalTransactionByMonth({ response, request }: HttpContext) {
    const { month } = request.qs()
    const total = await this.svc.totalCompletedTransactionsByMonth(month)
    return response.status(200).send({ message: 'Success', serve: { total } })
  }

  public async getTotalTransactionByStatus({ response, request }: HttpContext) {
    const { paymentStatus } = request.qs() // keep query param name biar ga breaking
    const total = await this.svc.totalTransactionsByStatus(paymentStatus)
    return response.status(200).send({ message: 'Success', serve: { total } })
  }

  public async getTotalTransactionByPeriod({ response }: HttpContext) {
    const data = await this.svc.completedTransactionsByPeriod()
    return response.status(200).send({ message: 'Success', serve: data })
  }

  public async getStatusTransactionByMonth({ response, request }: HttpContext) {
    const { month } = request.qs()
    const result = await this.svc.statusBreakdownByMonth(month)
    return response.ok({ message: 'Success', serve: result })
  }
}
