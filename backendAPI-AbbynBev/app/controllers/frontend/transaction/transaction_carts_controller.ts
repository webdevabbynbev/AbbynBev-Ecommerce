import type { HttpContext } from '@adonisjs/core/http'
import { CartService } from '#services/cart/cart_service'

export default class TransactionCartsController {
  private cartService = new CartService()

  // total item di icon keranjang
  public async getTotal({ response, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      if (!userId) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const dataCart = await this.cartService.getTotal(userId)

      return response.status(200).send({
        message: 'success',
        // kompatibel FE
        serve: dataCart,
        data: dataCart,
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
      if (!userId) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const qs: any = request.qs() || {}

      // ✅ support FE yang kirim isCheckout (camelCase)
      if (typeof qs.is_checkout === 'undefined' && typeof qs.isCheckout !== 'undefined') {
        qs.is_checkout = qs.isCheckout
      }

      const { items, subtotal, meta } = await this.cartService.getList(userId, qs, request)

      // ✅ return dua bentuk supaya FE lama & baru aman
      return response.status(200).send({
        message: 'success',

        // format baru
        data: items,
        subtotal,
        meta,

        // format kompatibilitas lama
        serve: {
          data: items,
          subtotal,
          meta,
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
      if (!userId) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

      const rawIds = request.input('cart_ids') ?? request.input('cartIds') ?? []
      const ids = Array.isArray(rawIds)
        ? rawIds.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0)
        : []

      // ✅ support snake_case & camelCase
      const rawIsCheckout = request.input('is_checkout')
      const rawIsCheckout2 = request.input('isCheckout')
      const isCheckout = Number(
        typeof rawIsCheckout !== 'undefined' ? rawIsCheckout : rawIsCheckout2
      )

      if (!Number.isFinite(isCheckout)) {
        return response.status(400).send({ message: 'is_checkout invalid', serve: null })
      }

      // ✅ FE kamu selalu call 2x (selected & unselected)
      // jadi kalau ids kosong, jangan error
      if (!ids.length) {
        return response.status(200).send({
          message: 'Cart selection updated',
          serve: { affected: 0 },
          data: { affected: 0 },
        })
      }

      const result = await this.cartService.updateSelection(userId, ids, isCheckout)

      // pastiin response konsisten
      return response.status(200).send({
        message: result?.message || 'Cart selection updated',
        serve: result?.serve ?? result ?? null,
        data: result?.serve ?? result ?? null,
      })
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
      if (!userId) {
        return response.status(401).send({ message: 'Unauthenticated', serve: null })
      }

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
