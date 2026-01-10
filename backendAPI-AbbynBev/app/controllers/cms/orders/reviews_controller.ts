import type { HttpContext } from '@adonisjs/core/http'
import Review from '#models/review'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'

export default class ReviewsController {
  public async get({ response, request }: HttpContext) {
    try {
      const { page = 1, perPage = 10, rating, productId, userId } = request.qs()

      const reviewsQuery = Review.query()
        .whereNull('deleted_at')
        .if(rating, (q) => q.where('rating', rating))
        .if(productId, (q) => q.where('product_id', productId))
        .if(userId, (q) => q.where('user_id', userId))
        .preload('user', (q) =>
          q.select(['id', 'first_name', 'last_name', 'email', 'photo_profile'])
        )
        .preload('product', (q) => q.select(['id', 'name', 'path']))
        .orderBy('created_at', 'desc')
        .paginate(Number(page), Number(perPage))

      const { meta, data } = (await reviewsQuery).toJSON()

      return response.status(200).send({
        message: 'success',
        serve: {
          data,
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

  public async show({ response, params }: HttpContext) {
    try {
      const review = await Review.query()
        .where('id', params.id)
        .whereNull('deleted_at')
        .preload('user', (q) =>
          q.select(['id', 'first_name', 'last_name', 'email', 'photo_profile'])
        )
        .preload('product', (q) => q.select(['id', 'name', 'path']))
        .first()

      if (!review) {
        return response.status(404).send({
          message: 'Review not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'success',
        serve: review,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const reviewId = params.id
      const review = await Review.query().where('id', reviewId).first()

      if (review) {
        await review.useTransaction(trx).softDelete()

        // @ts-ignore
        await emitter.emit('set:activity-log', {
          roleName: auth.user?.role_name,
          userName: auth.user?.name,
          activity: `Delete Review`,
          menu: 'Review',
          data: review.toJSON(),
        })

        await trx.commit()
        return response.status(200).send({
          message: 'Review deleted successfully.',
          serve: null,
        })
      } else {
        await trx.commit()
        return response.status(404).send({
          message: 'Review not found.',
          serve: null,
        })
      }
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: null,
      })
    }
  }
}
