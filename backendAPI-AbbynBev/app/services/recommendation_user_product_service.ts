import Product from '#models/product'
import User from '#models/user'
import Database from '@adonisjs/lucid/services/db'

type Pagination = { page: number; limit: number }

export default class RecommendationService {
  private static baseQueryForUser(user: User) {
    const concernIds = user.beautyConcerns.map((uc) => uc.concernOptionId)
    const profileIds = user.beautyProfileOptions.map((up) => up.profileCategoryOptionsId)
    const now = new Date()
    now.setHours(now.getHours() + 7)
    const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

    const query = Product.query()
      .whereNull('deleted_at')
      .whereIn('status', ['normal', 'war'] as const)
      .if(concernIds.length > 0, (q) =>
        q.whereHas('concernOptions', (cq) => cq.whereIn('concern_options.id', concernIds))
      )
      .if(profileIds.length > 0, (q) =>
        q.whereHas('profileOptions', (pq) => pq.whereIn('profile_category_options.id', profileIds))
      )
      .preload('brand')
      .preload('categoryType')
      .preload('persona')
      .preload('tags')
      .preload('medias')
      .preload('discounts', (query) =>
        query.where('start_date', '<=', dateString).where('end_date', '>=', dateString)
      )
      .preload('reviews', (reviewQuery) =>
        reviewQuery
          .whereNull('deleted_at')
          .orderBy('created_at', 'desc')
          .preload('user', (userQuery) =>
            userQuery.select(['id', 'first_name', 'last_name', 'photo_profile'])
          )
      )
      .preload('variants', (variantLoader) => {
        variantLoader.preload('attributes', (attributeLoader) => {
          attributeLoader
            .whereNull('attribute_values.deleted_at')
            .preload('attribute', (query) => query.whereNull('attributes.deleted_at'))
        })
      })
      .select('*')
      .select(
        Database.raw(
          `(
            SELECT COUNT(*) FROM product_concerns pc
            WHERE pc.product_id = products.id
              ${concernIds.length ? `AND pc.concern_option_id IN (${concernIds.join(',')})` : `AND 1=0`}
          ) as concern_match_count`
        )
      )
      .select(
        Database.raw(
          `(
            SELECT COUNT(*) FROM product_category_profiles pcp
            WHERE pcp.product_id = products.id
              ${
                profileIds.length
                  ? `AND pcp.profile_category_options_id IN (${profileIds.join(',')})`
                  : `AND 1=0`
              }
          ) as profile_match_count`
        )
      )
      .orderByRaw('status = ? DESC', ['war'])
      .orderBy('popularity', 'desc')
      .orderBy('created_at', 'desc')

    return query
  }

  public static async getUserRecommendations(user: User) {
    if (!user.$preloaded.beautyConcerns) await user.load('beautyConcerns')
    if (!user.$preloaded.beautyProfileOptions) await user.load('beautyProfileOptions')

    return await this.baseQueryForUser(user)
  }

  public static async getUserRecommendationsPaginated(user: User, { page, limit }: Pagination) {
    if (!user.$preloaded.beautyConcerns) await user.load('beautyConcerns')
    if (!user.$preloaded.beautyProfileOptions) await user.load('beautyProfileOptions')

    return await this.baseQueryForUser(user).paginate(page, limit)
  }
}
