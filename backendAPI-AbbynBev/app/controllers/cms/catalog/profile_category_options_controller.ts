import type { HttpContext } from '@adonisjs/core/http'
import ProfileCategoryOption from '#models/profile_category_option'
import {
  storeProfileCategoryOptionValidator,
  updateProfileCategoryOptionValidator,
} from '#validators/profile_category_option'
import emitter from '@adonisjs/core/services/emitter'

export default class ProfileCategoryOptionsController {
  public async get({ request, response }: HttpContext) {
    try {
      const { q, page = 1, per_page = 10, active_only, trashed_only } = request.qs()

      const options = await ProfileCategoryOption.query()
        .if(!trashed_only, (q) => q.apply((scopes) => scopes.active()))
        .if(trashed_only, (q) => q.apply((scopes) => scopes.trashed()))
        .if(active_only, (q) => q.where('is_active', true))
        .if(q, (query) => query.whereILike('label', `%${q}%`))
        .preload('category')
        .preload('products')
        .paginate(Number(page), Number(per_page))

      return response.ok({
        status: true,
        message: 'Success',
        data: options.toJSON().data,
        meta: options.toJSON().meta,
      })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async create({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(storeProfileCategoryOptionValidator)
      const option = await ProfileCategoryOption.create(payload)

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Create Profile Category Option',
        menu: 'Profile Category Options',
        data: option.toJSON(),
      })

      return response.created({ status: true, message: 'Created', data: option })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const option = await ProfileCategoryOption.query()
        .where('id', params.id)
        .apply((scopes) => scopes.active())
        .preload('category')
        .preload('products')
        .first()

      if (!option) return response.notFound({ status: false, message: 'Not found' })

      return response.ok({ status: true, message: 'Success', data: option })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfileCategoryOptionValidator)
      const option = await ProfileCategoryOption.query()
        .where('id', params.id)
        .apply((scopes) => scopes.active())
        .first()

      if (!option) return response.notFound({ status: false, message: 'Not found' })

      const oldData = option.toJSON()
      option.merge(payload)
      await option.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Update Profile Category Option',
        menu: 'Profile Category Options',
        data: { old: oldData, new: option.toJSON() },
      })

      return response.ok({ status: true, message: 'Updated', data: option })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    try {
      const option = await ProfileCategoryOption.find(params.id)
      if (!option) return response.notFound({ status: false, message: 'Not found' })

      await option.softDelete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Delete Profile Category Option (soft)',
        menu: 'Profile Category Options',
        data: option.toJSON(),
      })

      return response.ok({ status: true, message: 'Deleted (soft)', data: option })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }
}
