import type { HttpContext } from '@adonisjs/core/http'
import { CartService } from '../../services/cart/cart_service.js'

export default class TransactionCartsController {
  private cartService = new CartService()

  // total item di icon keranjang
  public async getTotal({ response, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const dataCart = await this.cartService.getTotal(userId)

      return response.status(200).send({
        message: 'success',
        serve: dataCart,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async get({ response, request, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const qs = request.qs()

      const { items, subtotal, meta } = await this.cartService.getList(userId, qs, request)

      return response.status(200).send({
        message: 'success',
        data: items,
        subtotal,
        meta,
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
      if (!user) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const result = await this.cartService.addToCart(user.id, {
        product_id: request.input('product_id'),
        variant_id: request.input('variant_id'),
        qty: request.input('qty'),
        is_buy_now: request.input('is_buy_now'),
        attributes: request.input('attributes') || [],
      })

      return response.status(result.httpStatus || 200).send({
        message: result.message,
        serve: result.serve,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async update({ response, request, auth, params }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const id = Number(params?.id ?? request.input('id'))
      const qty = Number(request.input('qty'))

      const result = await this.cartService.updateQty(user.id, id, qty)
      return response.status(result.httpStatus || 200).send({
        message: result.message,
        serve: result.serve,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateSelection({ response, request, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const ids = request.input('cart_ids') || []
      const isCheckout = request.input('is_checkout')

      const result = await this.cartService.updateSelection(userId, ids, isCheckout)
      return response.status(200).send(result)
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async miniCart({ response, auth, request }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const result = await this.cartService.miniCart(userId, request)
      return response.status(200).send(result)
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, request, auth, params }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const id = Number(params?.id ?? request.input('id'))
      const result = await this.cartService.deleteItem(user.id, id)

      return response.status(result.httpStatus || 200).send({
        message: result.message,
        serve: result.serve,
      })
    } catch (error: any) {
      const status = error.httpStatus || 500
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
