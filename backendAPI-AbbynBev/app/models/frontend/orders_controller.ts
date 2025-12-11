import type { HttpContext } from '@adonisjs/core/http'
import TransactionEcommerce from '#models/transaction_ecommerce'
import TransactionDetail from '#models/transaction_detail'

export default class OrdersController {
  public async index({ auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const orders = await TransactionEcommerce.query()
      .where('user_id', user.id)
      .preload('transaction', (t) => {
        t.preload('details', (d) => {
          d.preload('product')
        })
      })
      .preload('shipment')
      .orderBy('created_at', 'desc')

    return response.ok({
      data: orders,
    })
  }
}
