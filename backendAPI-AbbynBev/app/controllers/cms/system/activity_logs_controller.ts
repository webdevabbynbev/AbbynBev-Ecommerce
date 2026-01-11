import { HttpContext } from '@adonisjs/core/http'
import ActivityLog from '#models/activity_log'

export default class ActivityLogsController {
  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const search: string = queryString?.q
      const page: number = Number.isNaN(Number.parseInt(queryString.page))
        ? 1
        : Number.parseInt(queryString.page)
      const perPage: number = Number.isNaN(Number.parseInt(queryString.per_page))
        ? 10
        : Number.parseInt(queryString.per_page)
      const banners = await ActivityLog.query()
        .if(search, (query) => {
          query.where((q) => {
            q.whereILike('activity', `%${search}%`)
          })
        })
        .paginate(page, perPage)

      const meta = banners.toJSON().meta

      return response.status(200).send({
        message: 'Success',
        serve: {
          data: banners?.toJSON().data,
          ...meta,
        },
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
