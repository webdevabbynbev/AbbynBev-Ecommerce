import ProductDiscount from '#models/product_discount'
import ProductVariant from '#models/product_variant'
import TransactionCart from '#models/transaction_cart'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ProductOnline from '#models/product_online'

export default class TransactionCartsController {
  private calculatePrice({
    type,
    price,
    value,
    maxValue,
  }: {
    type: number
    price: number
    value: number
    maxValue: number
  }) {
    if (type === 1) {
      const disc = price * (value / 100)
      if (disc > maxValue) {
        return { price: price - maxValue, disc: maxValue }
      } else {
        return { price: price - disc, disc: disc }
      }
    } else {
      return { price: price - value, disc: value }
    }
  }

  public async getTotal({ response, auth }: HttpContext) {
    try {
      const dataCart = await TransactionCart.query()
        .where('user_id', auth.user?.id ?? 0)
        .where('is_checkout', '!=', 2)

      return response.status(200).send({
        message: 'success',
        serve: dataCart,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async get({ response, request, auth }: HttpContext) {
    try {
      const queryString = request.qs()
      const sortBy = queryString.field || 'created_at'
      const sortType = queryString.value || 'DESC'
      const isCheckout = queryString.is_checkout ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataCart = await TransactionCart.query()
        .where('transaction_carts.user_id', auth.user?.id ?? 0)
        .if(isCheckout !== '', (query) => {
          query.where('transaction_carts.is_checkout', isCheckout)
        })
        .preload('product', (query) => {
          query.preload('medias').preload('brand').preload('categoryType')
        })
        .preload('variant', (variantLoader) => {
          variantLoader.preload('attributes', (attributeLoader) => {
            attributeLoader.preload('attribute')
          })
        })
        .orderBy(`transaction_carts.${sortBy}`, sortType)
        .paginate(page, per_page)

      const { meta, data } = dataCart.toJSON()
      const subtotal = data
        .filter((item) => item.isCheckout === 1)
        .reduce((acc, item) => acc + Number(item.amount), 0)

      return response.status(200).send({
        message: 'success',
        serve: { data, subtotal, ...meta },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      // pastikan user login
      const user = auth.user
      if (!user) {
        await trx.rollback()
        return response.status(401).send({
          message: 'Unauthenticated',
          serve: null,
        })
      }

      // ambil & normalisasi input
      const productId = Number(request.input('product_id'))
      const variantId = Number(request.input('variant_id'))
      const qty = Number(request.input('qty') ?? 0)
      const isBuyNow = !!request.input('is_buy_now')
      const attributes = request.input('attributes') || []

      if (!productId || !variantId || qty <= 0) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Invalid payload: product_id, variant_id, dan qty wajib diisi',
          serve: null,
        })
      }

      const now = new Date()
      now.setHours(now.getHours() + 7)
      const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

      // cek apakah product online & aktif
      const productOnline = await ProductOnline.query({ client: trx })
        .where('product_id', productId)
        .where('is_active', true)
        .preload('product')
        .first()

      if (!productOnline) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Product not available online',
          serve: null,
        })
      }

      const dataProduct = productOnline.product
      if (!dataProduct) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Product not found',
          serve: null,
        })
      }

      // cek variant
      const dataProductVariant = await ProductVariant.query({ client: trx })
        .where('id', variantId)
        .first()

      if (!dataProductVariant) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Product variant not found',
          serve: null,
        })
      }

      // cek stock
      if (dataProductVariant.stock < qty) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Stock not enough',
          serve: null,
        })
      }

      // hitung harga & diskon
      let finalPrice = Number(dataProductVariant.price)
      let discount = 0

      const dataProductDisc = await ProductDiscount.query({ client: trx })
        .where('product_id', productId)
        .where('start_date', '<=', dateString)
        .where('end_date', '>=', dateString)
        .first()

      if (dataProductDisc) {
        const calc = this.calculatePrice({
          type: dataProductDisc.type,
          price: Number(dataProductVariant.price),
          value: Number(dataProductDisc.value),
          maxValue: Number(dataProductDisc.maxValue),
        })
        finalPrice = calc.price
        discount = calc.disc
      }

      // buat cart
      const dataCart = new TransactionCart()
      dataCart.useTransaction(trx)

      dataCart.userId = user.id                 // ✅ user, BUKAN id primary key
      dataCart.productId = productId
      dataCart.productVariantId = variantId

      dataCart.qty = qty
      if (isBuyNow) {
        dataCart.qtyCheckout = qty
        dataCart.isCheckout = 1
      }

      dataCart.price = Number(dataProductVariant.price)
      dataCart.discount = discount
      dataCart.amount = finalPrice * dataCart.qty
      dataCart.attributes = JSON.stringify(attributes)

      await dataCart.save()
      await trx.commit()

      return response.status(200).send({
        message: 'Successfully added to cart.',
        serve: dataCart,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateSelection({ response, request, auth }: HttpContext) {
    try {
      const ids = request.input('cart_ids') || []
      const isCheckout = request.input('is_checkout')

      if (ids.length > 0) {
        await TransactionCart.query()
          .whereIn('id', ids)
          .where('user_id', auth.user?.id ?? 0)
          .update({ isCheckout })
      }

      return response.status(200).send({
        message: 'Cart selection updated',
        serve: [],
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async miniCart({ response, auth }: HttpContext) {
    try {
      const carts = await TransactionCart.query()
        .where('user_id', auth.user?.id ?? 0)
        .where('is_checkout', '!=', 2)
        .preload('product', (q) => q.preload('medias'))
        .preload('variant')
        .orderBy('created_at', 'desc')
        .limit(10)

      const subtotal = carts.reduce((acc, item) => acc + Number(item.amount), 0)

      return response.status(200).send({
        message: 'success',
        serve: { data: carts.map((c) => c.toJSON()), subtotal },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataCart = await TransactionCart.query({ client: trx })
        .where('id', request.input('id'))
        .where('user_id', auth.user?.id ?? 0)
        .first()

      if (!dataCart) {
        await trx.rollback()
        return response.status(400).send({ message: 'Delete cart failed', serve: [] })
      }

      await dataCart.delete()
      await trx.commit()
      return response
        .status(200)
        .send({ message: 'Deleted successfully', serve: [] })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
