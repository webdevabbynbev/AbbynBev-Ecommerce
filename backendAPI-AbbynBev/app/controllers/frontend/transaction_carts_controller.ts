import ProductDiscountModel from '#models/product_discount'   // alias aman
import ProductVariant from '#models/product_variant'
import TransactionCart from '#models/transaction_cart'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ProductOnline from '#models/product_online'

export default class TransactionCartsController {
  // helper hitung harga setelah diskon per unit
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

  // total item di icon keranjang
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

  // list cart utama (dipakai /cart & checkout)
  public async get({ response, request, auth }: HttpContext) {
    try {
      const queryString = request.qs()
      const sortBy = queryString.field || 'created_at'
      const sortType = queryString.value || 'DESC'
      const isCheckout = queryString.is_checkout ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const cartQuery = await TransactionCart.query()
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

      const { meta, data } = cartQuery.toJSON() as { meta: any; data: any[] }

      // Normalisasi supaya frontend enak pakainya
      const items = data.map((row) => {
        const product = row.product || {}
        const medias = Array.isArray(product.medias) ? product.medias : []

        // qty yang dipakai di frontend
        const quantity = Number(row.qtyCheckout ?? row.qty ?? 0)

        // harga per unit
        const price = Number(
          row.price ??
            product.price ??
            product.realprice ??
            product.basePrice ??
            0,
        )

        const thumbnail =
          product.thumbnail ||
          product.thumbnailUrl ||
          product.image ||
          (medias[0] ? medias[0].url || medias[0].path || medias[0].file_path : null) ||
          '/placeholder.png'

        // nama variant
        let variantName = '-'
        if (row.variant) {
          const v = row.variant as any
          variantName = v.name || v.sku || v.code || ''
          if (!variantName && Array.isArray(v.attributes)) {
            const parts = v.attributes
              .map(
                (a: any) =>
                  a?.attribute_value ||
                  a?.label ||
                  a?.value ||
                  '',
              )
              .filter(Boolean)
            if (parts.length) variantName = parts.join(' / ')
          }
          if (!variantName) variantName = '-'
        }

        // kalau di DB sudah punya amount, pakai itu; kalau tidak, fallback hitung
        const lineAmount = Number(row.amount ?? price * quantity)

        return {
          ...row,
          amount: lineAmount,
          quantity,
          product: {
            ...product,
            price,
            thumbnail,
            variant_name: variantName,
          },
        }
      })

      const subtotal = items.reduce(
        (acc, item) => acc + Number(item.amount ?? 0),
        0,
      )

      // frontend: axios.get("/cart") → res.data.data (array)
      return response.status(200).send({
        message: 'success',
        data: items,
        subtotal,
        meta,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  // tambah ke keranjang
  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user
      if (!user) {
        await trx.rollback()
        return response.status(401).send({
          message: 'Unauthenticated',
          serve: null,
        })
      }

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

      // product online aktif?
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

      // variant?
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

      // stok cukup?
      if (dataProductVariant.stock < qty) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Stock not enough',
          serve: null,
        })
      }

      // harga & diskon per unit
      let finalPrice = Number(dataProductVariant.price)
      let discount = 0

      const dataProductDisc = await ProductDiscountModel.query({ client: trx })
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

      const dataCart = new TransactionCart()
      dataCart.useTransaction(trx)

      dataCart.userId = user.id
      dataCart.productId = productId
      dataCart.productVariantId = variantId

      dataCart.qty = qty
      dataCart.qtyCheckout = qty
      dataCart.isCheckout = isBuyNow ? 1 : 1 // sekarang semua dianggap ter-pilih

      dataCart.price = Number(dataProductVariant.price) // harga normal per unit
      dataCart.discount = discount                     // diskon per unit
      dataCart.amount = finalPrice * dataCart.qty      // total setelah diskon
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

  // 🔥 update qty cart (dipakai tombol + / - di frontend)
  public async update({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user
      if (!user) {
        await trx.rollback()
        return response.status(401).send({
          message: 'Unauthenticated',
          serve: null,
        })
      }

      const id = Number(request.input('id'))
      const qty = Number(request.input('qty'))

      if (!id || Number.isNaN(qty)) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Invalid payload',
          serve: null,
        })
      }

      const cart = await TransactionCart.query({ client: trx })
        .where('id', id)
        .where('user_id', user.id)
        .first()

      if (!cart) {
        await trx.rollback()
        return response.status(404).send({
          message: 'Cart item not found',
          serve: null,
        })
      }

      // kalau qty <= 0 → anggap delete
      if (qty <= 0) {
        await cart.delete()
        await trx.commit()
        return response.status(200).send({
          message: 'Deleted successfully',
          serve: [],
        })
      }

      cart.qty = qty
      cart.qtyCheckout = qty

      // hitung ulang amount berdasarkan price & discount per unit
      const pricePerUnit = Number(cart.price || 0)
      const discPerUnit = Number(cart.discount || 0)
      const finalPerUnit = pricePerUnit - discPerUnit

      cart.amount = finalPerUnit * qty

      await cart.save()
      await trx.commit()

      return response.status(200).send({
        message: 'Cart updated',
        serve: cart,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  // update centang item yang mau di-checkout
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

  // mini-cart (dropdown di header)
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

  // hapus item dari cart
  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const user = auth.user
      if (!user) {
        await trx.rollback()
        return response.status(401).send({
          message: 'Unauthenticated',
          serve: null,
        })
      }

      const id = Number(request.input('id'))

      const dataCart = await TransactionCart.query({ client: trx })
        .where('id', id)
        .where('user_id', user.id)
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
