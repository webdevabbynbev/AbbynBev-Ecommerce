import type { HttpContext } from '@adonisjs/core/http'
import Review from '#models/review'
import db from '@adonisjs/lucid/services/db'

export default class ReviewsController {
  public async get({ response, request }: HttpContext) {
    try {
      const { page = 1, perPage = 10, productId } = request.qs()

      const reviewsQuery = Review.query()
        .whereNull('deleted_at')
        .if(productId, (q) => q.where('product_id', productId))
        .preload('user', (q) => q.select(['id', 'first_name', 'last_name', 'photo_profile']))
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

  public async create({ response, request, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ message: 'Unauthorized' })

      const { productId, rating, comment, images, isVerifiedPurchase } = request.only([
        'productId',
        'rating',
        'comment',
        'images',
        'isVerifiedPurchase',
      ])

      const review = new Review()
      review.id = user.id
      review.productId = productId
      review.rating = rating
      review.comment = comment
      review.images = images
      review.isVerifiedPurchase = isVerifiedPurchase || false
      review.likes = 0
      await review.save()

      return response.created({
        message: 'Review created successfully.',
        serve: review,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async toggleLike({ response, auth, params, request }: HttpContext) {
    const trx = await db.transaction()
    try {
      const user = auth.user
      if (!user) return response.unauthorized({ message: 'Unauthorized' })

      const review = await Review.find(params.id)
      if (!review) {
        return response.notFound({ message: 'Review not found' })
      }
      const { action } = request.only(['action'])
      review.useTransaction(trx)

      if (action === 'like') {
        review.likes = (review.likes || 0) + 1
      } else if (action === 'unlike' && (review.likes || 0) > 0) {
        review.likes = review.likes - 1
      }

      await review.save()
      await trx.commit()

      return response.ok({
        message: `Review ${action}d successfully`,
        likes: review.likes,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({ message: error.message })
    }
  }
}
