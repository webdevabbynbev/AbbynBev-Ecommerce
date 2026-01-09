import type { HttpContext } from '@adonisjs/core/http'
import ConcernOption from '#models/concern_option'
import Helpers from '../../utils/helpers.js'
import {
  createConcernOptionValidator,
  updateConcernOptionValidator,
} from '#validators/concern_option'
import emitter from '@adonisjs/core/services/emitter'

export default class ConcernOptionsController {
  public async get({ request, response }: HttpContext) {
    try {
      const { q, concern_id, page = 1, per_page = 10 } = request.qs()

      const options = await ConcernOption.query()
        .apply((scopes) => scopes.active())
        .if(concern_id, (query) => query.where('concern_id', concern_id))
        .if(q, (query) => query.whereILike('name', `%${q}%`))
        .preload('concern', (query) => query.apply((scopes) => scopes.active()))
        .preload('products')
        .paginate(Number(page), Number(per_page))

      return response.ok({
        message: 'Success',
        serve: {
          data: options.toJSON().data,
          ...options.toJSON().meta,
        },
      })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async store({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createConcernOptionValidator)

      const option = await ConcernOption.create({
        ...payload,
        slug: await Helpers.generateSlug(payload.name),
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Concern Option`,
        menu: 'Concern Option',
        data: option.toJSON(),
      })

      return response.created({ message: 'Success', serve: option })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const option = await ConcernOption.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.active())
        .preload('concern')
        .first()

      if (!option) {
        return response.notFound({ message: 'Concern Option not found', serve: null })
      }

      return response.ok({ message: 'Success', serve: option })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateConcernOptionValidator)

      const option = await ConcernOption.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.active())
        .first()

      if (!option) {
        return response.notFound({ message: 'Concern Option not found', serve: null })
      }

      const oldData = option.toJSON()

      option.merge({
        concernId: payload.concernId ?? option.concernId,
        name: payload.name ?? option.name,
        slug: payload.name ? await Helpers.generateSlug(payload.name) : option.slug,
        description: payload.description ?? option.description,
      })

      await option.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Concern Option`,
        menu: 'Concern Option',
        data: { old: oldData, new: option.toJSON() },
      })

      return response.ok({ message: 'Success', serve: option })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    try {
      const option = await ConcernOption.query().where('slug', params.slug).first()
      if (!option) {
        return response.notFound({ message: 'Concern Option not found', serve: null })
      }

      const oldData = option.toJSON()
      await option.delete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Concern Option`,
        menu: 'Concern Option',
        data: oldData,
      })

      return response.ok({ message: 'Deleted Concern Option', serve: true })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }

  public async restore({ params, response }: HttpContext) {
    try {
      const option = await ConcernOption.query()
        .where('slug', params.slug)
        .apply((scopes) => scopes.trashed())
        .first()

      if (!option) {
        return response.notFound({
          message: 'Concern Option not found or already active',
          serve: null,
        })
      }

      await option.restore()
      return response.ok({ message: 'Restored', serve: option })
    } catch (e) {
      return response.internalServerError({ message: e.message, serve: null })
    }
  }
}
