import type { HttpContext } from '@adonisjs/core/http'
import ProfileCategory from '#models/profile_category'
import {
  storeProfileCategoryValidator,
  updateProfileCategoryValidator,
} from '#validators/profile_category'
import emitter from '@adonisjs/core/services/emitter'

export default class ProfileCategoriesController {
  public async get({ request, response }: HttpContext) {
    try {
      const { q, page = 1, per_page = 10, trashed_only } = request.qs()

      const categories = await ProfileCategory.query()
        .if(!trashed_only, (q) => q.apply((scopes) => scopes.active()))
        .if(trashed_only, (q) => q.apply((scopes) => scopes.trashed()))
        .if(q, (query) => query.whereILike('name', `%${q}%`))
        .preload('options', (q) => q.apply((scopes) => scopes.active()).preload('products'))
        .paginate(Number(page), Number(per_page))

      return response.ok({
        status: true,
        message: 'Success',
        data: categories.toJSON().data,
        meta: categories.toJSON().meta,
      })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async create({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(storeProfileCategoryValidator)
      const category = await ProfileCategory.create(payload)

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Create Profile Category',
        menu: 'Profile Categories',
        data: category.toJSON(),
      })

      return response.created({ status: true, message: 'Created', data: category })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const category = await ProfileCategory.query()
        .where('id', params.id)
        .apply((scopes) => scopes.active())
        .preload('options', (q) => q.apply((scopes) => scopes.active()).preload('products'))
        .first()

      if (!category) {
        return response.notFound({ status: false, message: 'Not found' })
      }

      return response.ok({ status: true, message: 'Success', data: category })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfileCategoryValidator)
      const category = await ProfileCategory.query()
        .where('id', params.id)
        .apply((scope) => scope.active())
        .first()

      if (!category) return response.notFound({ status: false, message: 'Not found' })

      const oldData = category.toJSON()
      category.merge(payload)
      await category.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Update Profile Category',
        menu: 'Profile Categories',
        data: { old: oldData, new: category.toJSON() },
      })

      return response.ok({ status: true, message: 'Updated', data: category })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    try {
      const category = await ProfileCategory.find(params.id)
      if (!category) return response.notFound({ status: false, message: 'Not found' })

      await category.softDelete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Delete Profile Category',
        menu: 'Profile Categories',
        data: category.toJSON(),
      })

      return response.ok({ status: true, message: 'Deleted (soft)', data: category })
    } catch (e) {
      return response.internalServerError({ status: false, message: e.message })
    }
  }
}
