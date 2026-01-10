import type { HttpContext } from '@adonisjs/core/http'
import Faq from '#models/faq'
import { createFaq } from '#validators/faq'
import emitter from '@adonisjs/core/services/emitter'

export default class FaqsController {
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

      const faqs = await Faq.query()
        .select(['id', 'answer', 'question'])
        .apply((s) => s.active())
        .if(search, (query) => query.whereILike('question', `%${search}%`))
        .where('is_published', 1)
        .orderBy('createdAt', 'desc')
        .paginate(page, perPage)

      return response.status(200).send({
        message: 'Success',
        serve: {
          data: faqs?.toJSON().data,
          ...faqs?.toJSON().meta,
        },
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const payload = await createFaq.validate(request.all())

      const faq: Faq = await Faq.create({
        ...payload,
        createdBy: auth.user?.id,
        updatedBy: auth.user?.id,
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create FAQ`,
        menu: 'FAQ',
        data: faq.toJSON(),
      })

      return response.status(201).send({
        message: 'Success',
        serve: faq,
      })
    } catch (e) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }

      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async update({ response, params, request, auth }: HttpContext) {
    try {
      const { id } = params

      const payload = await createFaq.validate(request.all())

      const faq: Faq | null = (await Faq.findWithSoftDelete(id)) as Faq

      if (!faq) {
        return response.status(404).send({
          message: 'Faq not found',
          serve: null,
        })
      }

      const oldFaq = faq.toJSON()

      faq.merge({
        ...payload,
        updatedBy: auth.user?.id,
      })

      await faq.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update FAQ`,
        menu: 'FAQ',
        data: { old: oldFaq, new: faq.toJSON() },
      })

      return response.status(200).send({
        message: 'Success',
        serve: faq,
      })
    } catch (e) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }

      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const { id } = params

      const faq: Faq | null = (await Faq.findWithSoftDelete(id)) as Faq

      if (!faq) {
        return response.status(404).send({
          message: 'Faq not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: faq,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    try {
      const { id } = params

      const faq: Faq | null = (await Faq.findWithSoftDelete(id)) as Faq

      if (!faq) {
        return response.status(404).send({
          message: 'Faq not found',
          serve: null,
        })
      }

      await faq.softDelete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete FAQ`,
        menu: 'FAQ',
        data: faq.toJSON(),
      })

      return response.status(200).send({
        message: 'Success',
        serve: true,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
