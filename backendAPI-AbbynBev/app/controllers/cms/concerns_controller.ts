import type { HttpContext } from '@adonisjs/core/http'
import Concern from '#models/concern'
import Helpers from '../../utils/helpers.js'
import { createConcernValidator, updateConcernValidator } from '#validators/concern'
import emitter from '@adonisjs/core/services/emitter'

export default class ConcernsController {
  public async get({ request, response }: HttpContext) {
    try {
      const { q, page = 1, per_page = 10 } = request.qs()

      const concerns = await Concern.query()
        .apply((scopes) => scopes.active())
        .if(q, (query) => {
          query.whereILike('name', `%${q}%`)
        })
        .preload('options', (query) => {
          query.apply((scopes) => scopes.active()).orderBy('position', 'asc')
        })
        .paginate(Number(page), Number(per_page))

      return response.ok({
        message: 'Success',
        serve: {
          data: concerns.toJSON().data,
          ...concerns.toJSON().meta,
        },
      })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async create({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createConcernValidator)

      const concern = await Concern.create({
        ...payload,
        slug: await Helpers.generateSlug(payload.name),
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Concern ${concern.name}`,
        menu: 'Concern',
        data: concern.toJSON(),
      })

      return response.created({ message: 'Success', serve: concern })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const concern = await Concern.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.active())
        .preload('options', (query) => {
          query.apply((scopes) => scopes.active()).orderBy('position', 'asc')
        })

      return response.ok({ message: 'Success', serve: concern })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateConcernValidator)

      const concern = await Concern.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.active())
        .first()

      if (!concern) {
        return response.notFound({ message: 'Concern not found', serve: null })
      }

      const oldData = concern.toJSON()

      concern.merge({
        name: payload.name ?? concern.name,
        slug: payload.name ? await Helpers.generateSlug(payload.name) : concern.slug,
        description: payload.description ?? concern.description,
      })
      await concern.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Concern ${oldData.name}`,
        menu: 'Concern',
        data: { old: oldData, new: concern.toJSON() },
      })

      return response.ok({ message: 'Success', serve: concern })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    try {
      const concern = await Concern.query().where('slug', params.slug).first()
      if (!concern) {
        return response.notFound({ message: 'Concern not found', serve: null })
      }

      const oldData = concern.toJSON()
      await concern.softDelete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Deleted Concern ${oldData.name}`,
        menu: 'Concern',
        data: oldData,
      })

      return response.ok({ message: 'Deleted Concern', serve: true })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async restore({ params, response, auth }: HttpContext) {
    try {
      const concern = await Concern.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.trashed())
        .first()

      if (!concern) {
        return response.notFound({ message: 'Concern not found or already active', serve: null })
      }

      await concern.restore()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Restore Concern ${concern.name}`,
        menu: 'Concern',
        data: concern.toJSON(),
      })

      return response.ok({ message: 'Restored', serve: concern })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }
}
