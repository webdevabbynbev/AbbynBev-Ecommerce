import type { HttpContext } from '@adonisjs/core/http'
import RecommendationService from '../../services/recommendation_user_product_service.js'

export default class ProductRecommendationsController {
  public async getProductRecommendations({ response, request, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = Number(request.input('page', 1))
      const limit = Math.min(Number(request.input('limit', 20)), 50)

      const result = await RecommendationService.getUserRecommendationsPaginated(user, {
        page,
        limit,
      })

      const mappedData = result.all().map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice,
        status: product.status,
        popularity: product.popularity,
        brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
        thumbnail: product.medias?.[0]?.url || null,
        concern_match_count: product.$extras.concern_match_count || 0,
        profile_match_count: product.$extras.profile_match_count || 0,
      }))

      return response.status(200).send({
        message: 'success',
        serve: {
          data: mappedData,
          pagination: {
            page: result.currentPage,
            perPage: result.perPage,
            total: result.total,
            lastPage: result.lastPage,
          },
        },
      })
    } catch (error) {
      console.error('[getRecommendations] Error:', error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
