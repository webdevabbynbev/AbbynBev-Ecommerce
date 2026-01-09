import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Wishlist from '#models/wishlist'
import ProductOnline from '#models/product_online'

export default class WishlistsController {
  public async get({ response, request, auth }: HttpContext) {
    try {
      const queryString = request.qs()
      const sortBy = queryString.field || 'created_at'
      const sortType = queryString.value || 'DESC'
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataWishlist = await Wishlist.query()
        .where('user_id', auth.user?.id ?? 0)
        .preload('product', (query) => {
          return query.preload('medias').preload('tags')
        })
        .orderBy(`${sortBy}`, sortType)
        .paginate(page, per_page)

      const meta = dataWishlist.toJSON().meta

      return response.status(200).send({
        message: '',
        serve: {
          data: dataWishlist?.toJSON().data,
          ...meta,
        },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async list({ response, auth }: HttpContext) {
    try {
      const dataWishlist = await Wishlist.query()
        .where('user_id', auth.user?.id ?? 0)
        .preload('product', (query) => {
          return query.preload('medias')
        })

      return response.status(200).send({
        message: '',
        serve: dataWishlist,
      })
    } catch (error) {
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const productOnline = await ProductOnline.query()
        .where('product_id', request.input('product_id'))
        .where('is_active', true)
        .preload('product', (p) => p.preload('medias'))
        .first()

      if (!productOnline) {
        await trx.commit()
        return response.status(400).send({
          message: 'Product not available online.',
          serve: null,
        })
      }
      const existingWishlist = await Wishlist.query()
        .where('product_id', request.input('product_id'))
        .where('user_id', auth.user?.id ?? 0)
        .first()

      let wishlist: Wishlist | null = null
      if (existingWishlist) {
        wishlist = existingWishlist
      } else {
        wishlist = new Wishlist()
        wishlist.productId = request.input('product_id')
        wishlist.id = auth.user?.id ?? 0
        await wishlist.save()
      }

      await trx.commit()
      return response.status(200).send({
        message: 'Added to wishlist.',
        serve: productOnline,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataWishlist = await Wishlist.query()
        .where('product_id', request.input('product_id'))
        .where('user_id', auth.user?.id ?? 0)
        .first()
      if (!dataWishlist) {
        await trx.commit()
        return response.status(400).send({
          message: 'Wishlist not found.',
          serve: [],
        })
      }
      await dataWishlist.delete()
      await trx.commit()
      return response.status(200).send({
        message: 'Success Delete',
        serve: [],
      })
    } catch (error) {
      await trx.rollback()
      console.log(error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
