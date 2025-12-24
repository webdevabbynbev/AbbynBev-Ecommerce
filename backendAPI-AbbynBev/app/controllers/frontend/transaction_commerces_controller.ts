import type { HttpContext } from '@adonisjs/core/http'

import { EcommerceCheckoutService } from '../../services/ecommerce/ecommerce_checkout_service.js'
import { EcommerceOrderService } from '../../services/ecommerce/ecommerce_order_service.js'
import { EcommerceWebhookService } from '../../services/ecommerce/ecommerce_webhook_service.js'

export default class TransactionEcommerceController {
  private checkout = new EcommerceCheckoutService()
  private orders = new EcommerceOrderService()
  private webhook = new EcommerceWebhookService()

  public async get({ response, request, auth }: HttpContext) {
    try {
      const paginator = await this.orders.getList(auth.user?.id ?? 0, request.qs())

      return response.status(200).send({
        message: 'success',
        serve: {
          data: paginator.toJSON().data,
          ...paginator.toJSON().meta,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const result = await this.checkout.createCheckout(user, {
        cart_ids: request.input('cart_ids'),
        voucher: request.input('voucher'),
        user_address_id: request.input('user_address_id'),
        shipping_service_type: request.input('shipping_service_type'),
        shipping_service: request.input('shipping_service'),
        shipping_price: request.input('shipping_price'),
        is_protected: request.input('is_protected'),
        protection_fee: request.input('protection_fee'),
        weight: request.input('weight'),
        shipping_etd: request.input('shipping_etd'),
        etd: request.input('etd'),
      })

      return response.status(200).send({
        message: 'Transaction created successfully.',
        serve: {
          ...result.transaction.toJSON(),
          ecommerce: result.ecommerce.toJSON(),
          shipment: result.shipment.toJSON(),
          meta: result.meta,
        },
      })
    } catch (e: any) {
      const status = e.httpStatus || 500
      return response.status(status).send({
        message: e.message || 'Internal Server Error',
        serve: e?.response?.data || null,
      })
    }
  }

  public async webhookMidtrans({ request, response }: HttpContext) {
    try {
      await this.webhook.handleMidtransWebhook(request.all())
      return response.status(200).json({ message: 'ok', serve: [] })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).json({ message: error.message, serve: [] })
    }
  }

  public async getByTransactionNumber({ response, request }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const result = await this.orders.getByTransactionNumber(String(transactionNumber || ''))

      return response.status(200).send({
        message: 'success',
        serve: {
          data: result.dataTransaction,
          waybill: result.waybill,
        },
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async confirmOrder({ request, response, auth }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const tx = await this.orders.confirmOrder(auth.user?.id ?? 0, String(transactionNumber || ''))

      return response.status(200).send({
        message: 'Transaction marked as completed.',
        serve: tx,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }

  public async requestPickup({ response }: HttpContext) {
    return response.status(501).send({
      message: 'Pickup request is not implemented (RajaOngkir/Komerce removed).',
      serve: null,
    })
  }

  public async updateWaybillStatus({ request, response }: HttpContext) {
    try {
      const transactionNumber = request.input('transaction_number')
      const newStatus = request.input('status')

      const shipment = await this.orders.updateWaybillStatus(String(transactionNumber || ''), newStatus)

      return response.status(200).send({
        message: 'Waybill status updated',
        serve: shipment,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error',
        serve: [],
      })
    }
  }
}
