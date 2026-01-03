import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'

export default class BannerOrdersController {
  public async updateProductIndex({ request, response }: HttpContext) {
    const updates = request.input('updates') || []
    const batchSize = 100

    try {
      // apply updates from client
      for (const update of updates) {
        const { id, order } = update
        await Banner.query().where('id', id).update({ order })
      }

      // normalize order biar rapih 1..N
      let page = 1
      let hasMore = true

      while (hasMore) {
        const banners = await Banner.query().orderBy('order', 'asc').paginate(page, batchSize)
        const rows = banners.all()

        if (rows.length === 0) {
          hasMore = false
          break
        }

        for (let i = 0; i < rows.length; i++) {
          const banner = rows[i]
          const normalizedOrder = (page - 1) * batchSize + i + 1
          if (banner.order !== normalizedOrder) {
            await Banner.query().where('id', banner.id).update({ order: normalizedOrder })
          }
        }

        page++
      }

      return response.status(200).send({
        message: 'Banner updated and reordered successfully.',
        serve: [],
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
