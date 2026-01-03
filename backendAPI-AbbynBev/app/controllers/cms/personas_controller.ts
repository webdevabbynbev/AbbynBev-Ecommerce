import type { HttpContext } from '@adonisjs/core/http'
import Persona from '#models/persona'
import Helpers from '../../utils/helpers.js'
import { storePersonaValidator, updatePersonaValidator } from '#validators/persona'
import emmiter from '@adonisjs/core/services/emitter'

export default class PersonasController {
  public async get({ request, response }: HttpContext) {
    try {
      const queryString = request.qs()
      const search: string = queryString?.q
      const page: number = Number.isNaN(Number.parseInt(queryString.page))
        ? 1
        : Number.parseInt(queryString.page)
      const perPage: number = Number.isNaN(Number.parseInt(queryString.per_page))
        ? 10
        : Number.parseInt(queryString.per_page)

      const personas = await Persona.query()
        .whereNull('deleted_at')
        .if(search, (query) => {
          query.whereILike('name', `%${search}%`)
        })
        .paginate(page, perPage)

      return response.ok({
        message: 'Success',
        serve: {
          data: personas.toJSON().data,
          ...personas.toJSON().meta,
        },
      })
    } catch (e) {
      return response.status(500).send({ message: e.message, serve: null })
    }
  }

  public async create({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(storePersonaValidator)

      const persona = await Persona.create({
        ...payload,
        slug: await Helpers.generateSlug(payload.name),
      })

      // @ts-ignore
      await emmiter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Persona ${persona.name}`,
        menu: 'Persona',
        data: persona.toJSON(),
      })

      return response.created({
        message: 'Success',
        serve: persona,
      })
    } catch (e) {
      return response.status(500).send({ message: e.message, serve: null })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const { slug } = params
      const persona = await Persona.query().where('slug', slug).whereNull('deleted_at').first()

      if (!persona) {
        return response.notFound({
          message: 'Persona not found',
          serve: null,
        })
      }

      return response.ok({
        message: 'Success',
        serve: persona,
      })
    } catch (e) {
      return response.status(500).send({ message: e.message, serve: null })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const { slug } = params
      const payload = await request.validateUsing(updatePersonaValidator)

      const persona = await Persona.query().where('slug', slug).whereNull('deleted_at').first()

      if (!persona) {
        return response.notFound({
          message: 'Persona not found',
          serve: null,
        })
      }

      const oldData = persona.toJSON()

      persona.merge({
        name: payload.name ?? persona.name,
        slug: payload.name ? await Helpers.generateSlug(payload.name) : persona.slug,
        description: payload.description ?? persona.description,
      })

      await persona.save()
      const newData = persona.toJSON()

      // @ts-ignore
      await emmiter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Persona ${oldData.name}`,
        menu: 'Persona',
        data: { old: oldData, new: newData },
      })

      return response.ok({
        message: 'Success',
        serve: persona,
      })
    } catch (e) {
      return response.status(500).send({ message: e.message, serve: null })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    try {
      const { slug } = params
      const persona = await Persona.query().where('slug', slug).first()

      if (!persona) {
        return response.notFound({
          message: 'Persona not found',
          serve: null,
        })
      }

      const oldData = persona.toJSON()
      await persona.delete()

      // @ts-ignore
      await emmiter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Persona ${oldData.name}`,
        menu: 'Persona',
        data: oldData,
      })

      return response.ok({
        message: 'Success',
        serve: true,
      })
    } catch (e) {
      return response.status(500).send({ message: e.message, serve: null })
    }
  }
}
