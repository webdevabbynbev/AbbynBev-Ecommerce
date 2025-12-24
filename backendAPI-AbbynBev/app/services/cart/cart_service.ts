// app/services/cart/cart_service.ts
import db from '@adonisjs/lucid/services/db'
import ProductVariant from '#models/product_variant'
import ProductOnline from '#models/product_online'
import TransactionCart from '#models/transaction_cart'

import { CartRepository } from './cart_repository.js'
import { CartPricingService } from './cart_pricing_service.js'
import { CartPresenter } from './cart_presenter.js'

export class CartService {
  private repo = new CartRepository()
  private pricing = new CartPricingService()
  private presenter = new CartPresenter()

  async getTotal(userId: number) {
    return this.repo.getTotalRaw(userId)
  }

  async getList(userId: number, qs: any, request: any) {
    const sortBy = qs.field || 'created_at'
    const sortType = qs.value || 'DESC'
    const isCheckout = qs.is_checkout ?? ''
    const page = isNaN(parseInt(qs.page)) ? 1 : parseInt(qs.page)
    const perPage = isNaN(parseInt(qs.per_page)) ? 10 : parseInt(qs.per_page)

    const paginator = await this.repo.paginateForUser(userId, {
      sortBy,
      sortType,
      isCheckout,
      page,
      perPage,
    })

    const json = paginator.toJSON() as any
    return this.presenter.presentPaginated({ meta: json.meta, data: json.data }, request)
  }

  async addToCart(userId: number, payload: any) {
    return db.transaction(async (trx) => {
      const productId = Number(payload.product_id)
      const variantId = Number(payload.variant_id)
      const qty = Number(payload.qty ?? 0)
      const isBuyNow = !!payload.is_buy_now
      const attributes = payload.attributes || []

      if (!productId || !variantId || qty <= 0) {
        const err: any = new Error('Invalid payload: product_id, variant_id, dan qty wajib diisi')
        err.httpStatus = 400
        throw err
      }

      const productOnline = await ProductOnline.query({ client: trx })
        .where('product_id', productId)
        .where('is_active', true)
        .preload('product')
        .first()

      if (!productOnline || !productOnline.product) {
        const err: any = new Error('Product not available online')
        err.httpStatus = 400
        throw err
      }

      const variant = await ProductVariant.query({ client: trx }).where('id', variantId).first()
      if (!variant) {
        const err: any = new Error('Product variant not found')
        err.httpStatus = 400
        throw err
      }

      const pricePerUnit = Number(variant.price)
      const discountPerUnit = await this.pricing.getDiscountPerUnit(trx, productId, pricePerUnit)
      const finalPerUnit = Math.max(0, pricePerUnit - discountPerUnit)

      const existing = await this.repo.findExisting(trx, userId, productId, variantId)

      if (existing) {
        const newQty = Number(existing.qty ?? 0) + qty
        if (Number(variant.stock) < newQty) {
          const err: any = new Error('Stock not enough')
          err.httpStatus = 400
          throw err
        }

        existing.qty = newQty
        existing.qtyCheckout = newQty
        existing.isCheckout = isBuyNow ? 1 : 1 // keep behavior (selalu 1)
        existing.price = pricePerUnit
        existing.discount = discountPerUnit
        existing.amount = finalPerUnit * newQty
        existing.attributes = JSON.stringify(attributes)

        await existing.save()

        return { message: 'Cart updated (merged)', serve: existing, httpStatus: 200 }
      }

      if (Number(variant.stock) < qty) {
        const err: any = new Error('Stock not enough')
        err.httpStatus = 400
        throw err
      }

      const cart = new TransactionCart()
      cart.useTransaction(trx)

      cart.userId = userId
      cart.productId = productId
      cart.productVariantId = variantId
      cart.qty = qty
      cart.qtyCheckout = qty
      cart.isCheckout = isBuyNow ? 1 : 1 // keep behavior
      cart.price = pricePerUnit
      cart.discount = discountPerUnit
      cart.amount = finalPerUnit * qty
      cart.attributes = JSON.stringify(attributes)

      await cart.save()

      return { message: 'Successfully added to cart.', serve: cart, httpStatus: 200 }
    })
  }

  async updateQty(userId: number, cartId: number, qty: number) {
    return db.transaction(async (trx) => {
      if (!cartId || !Number.isFinite(qty)) {
        const err: any = new Error('Invalid payload')
        err.httpStatus = 400
        throw err
      }

      const cart = await this.repo.findByIdForUser(trx, userId, cartId)
      if (!cart) {
        const err: any = new Error('Cart item not found')
        err.httpStatus = 404
        throw err
      }

      const variant: any = (cart as any).variant
      if (variant && typeof variant.stock === 'number' && variant.stock < qty) {
        const err: any = new Error('Stock not enough')
        err.httpStatus = 400
        throw err
      }

      if (qty <= 0) {
        await cart.delete()
        return { message: 'Deleted successfully', serve: [], httpStatus: 200 }
      }

      cart.qty = qty
      cart.qtyCheckout = qty

      const pricePerUnit = Number(cart.price || 0)
      const discPerUnit = Number(cart.discount || 0)
      const finalPerUnit = Math.max(0, pricePerUnit - discPerUnit)

      cart.amount = finalPerUnit * qty
      await cart.save()

      return { message: 'Cart updated', serve: cart, httpStatus: 200 }
    })
  }

  async updateSelection(userId: number, cartIds: any[], isCheckout: any) {
    const ids = Array.isArray(cartIds) ? cartIds.map((x) => Number(x)).filter((x) => x > 0) : []
    if (ids.length > 0) {
      await TransactionCart.query().whereIn('id', ids).where('user_id', userId).update({ isCheckout })
    }
    return { message: 'Cart selection updated', serve: [] }
  }

  async miniCart(userId: number, request: any) {
    const carts = await this.repo.miniForUser(userId, 10)
    const { items, subtotal } = this.presenter.presentMini(carts.map((c) => c.toJSON()), request)
    return { message: 'success', serve: { data: items, subtotal } }
  }

  async deleteItem(userId: number, cartId: number) {
    return db.transaction(async (trx) => {
      if (!cartId) {
        const err: any = new Error('Invalid id')
        err.httpStatus = 400
        throw err
      }

      const cart = await this.repo.findByIdOnly(trx, userId, cartId)
      if (!cart) {
        const err: any = new Error('Cart item not found')
        err.httpStatus = 404
        throw err
      }

      await cart.delete()
      return { message: 'Deleted successfully', serve: [], httpStatus: 200 }
    })
  }
}
