// app/controllers/frontend/orders_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { EcommerceOrderService } from '#services/ecommerce/ecommerce_order_service'
import NumberUtils from '#utils/number'

export default class OrdersController {
  private service = new EcommerceOrderService()

  private getUserId(auth: any) {
    return NumberUtils.toNumber(auth.user?.id ?? auth.user?.userId, 0)
  }

  /**
   * GET /orders
   */
  public async index({ auth, request, response }: HttpContext) {
    try {
      const userId = this.getUserId(auth)
      if (!userId) return response.status(401).send({ message: 'Unauthorized', serve: [] })

      const qs = request.qs()
      const data = await this.service.getList(userId, qs)

      return response.status(200).send({
        message: 'success',
        serve: data,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  /**
   * GET /orders/:transactionNumber
   * show detail + auto sync tracking (service sudah handle)
   */
  public async show({ auth, params, response }: HttpContext) {
    try {
      const userId = this.getUserId(auth)
      if (!userId) return response.status(401).send({ message: 'Unauthorized', serve: [] })

      const transactionNumber = String(params.transactionNumber || '').trim()
      if (!transactionNumber) {
        return response.status(400).send({ message: 'transactionNumber invalid', serve: [] })
      }

      const result = await this.service.getByTransactionNumber(transactionNumber)

      // ✅ guard ownership (tanpa user_id)
      const txUserId =
        Number((result as any)?.dataTransaction?.userId) ||
        Number((result as any)?.dataTransaction?.transaction?.userId) ||
        0

      if (txUserId && txUserId !== userId) {
        return response.status(403).send({ message: 'Forbidden', serve: [] })
      }

      return response.status(200).send({
        message: 'success',
        serve: (result as any).dataTransaction,
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  /**
   * PUT /orders/:transactionNumber/confirm
   */
  public async confirm({ auth, params, response }: HttpContext) {
    try {
      const userId = this.getUserId(auth)
      if (!userId) return response.status(401).send({ message: 'Unauthorized', serve: [] })

      const transactionNumber = String(params.transactionNumber || '').trim()
      if (!transactionNumber) {
        return response.status(400).send({ message: 'transactionNumber invalid', serve: [] })
      }

      const updated = await this.service.confirmOrder(userId, transactionNumber)

      return response.status(200).send({
        message: 'Pesanan berhasil dikonfirmasi selesai.',
        serve: updated,
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  /**
   * PUT /orders/:transactionNumber/refresh-tracking
   */
  public async refreshTracking({ auth, params, response }: HttpContext) {
    try {
      const userId = this.getUserId(auth)
      if (!userId) return response.status(401).send({ message: 'Unauthorized', serve: [] })

      const transactionNumber = String(params.transactionNumber || '').trim()
      if (!transactionNumber) {
        return response.status(400).send({ message: 'transactionNumber invalid', serve: [] })
      }

      const result = await this.service.getByTransactionNumber(transactionNumber)

      // ✅ guard ownership (tanpa user_id)
      const txUserId =
        Number((result as any)?.dataTransaction?.userId) ||
        Number((result as any)?.dataTransaction?.transaction?.userId) ||
        0

      if (txUserId && txUserId !== userId) {
        return response.status(403).send({ message: 'Forbidden', serve: [] })
      }

      return response.status(200).send({
        message: 'Tracking berhasil diperbarui.',
        serve: (result as any).dataTransaction,
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }
}
