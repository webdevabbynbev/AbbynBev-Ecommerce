import type { HttpContext } from '@adonisjs/core/http'
import RecommendationService from '#services/recommendation_user_product_service'

export default class ProductRecommendationsController {
  private resolveVariantPrice(product: any): number | null {
    const variants = Array.isArray(product?.variants) ? product.variants : []
    const variantPrices = variants
      .map((variant: any) => Number(variant?.price))
      .filter((value: number) => Number.isFinite(value) && value > 0)

    return variantPrices.length ? Math.min(...variantPrices) : null
  }
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
        price: this.resolveVariantPrice(product) ?? product.basePrice,
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
