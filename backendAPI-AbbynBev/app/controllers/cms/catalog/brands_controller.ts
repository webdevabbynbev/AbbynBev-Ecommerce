import type { HttpContext } from '@adonisjs/core/http'
import Helpers from '#utils/helpers'
import Brand from '#models/brand'
import { createBrandValidator, updateBrandValidator } from '#validators/brand'
import emitter from '@adonisjs/core/services/emitter'

export default class BrandsController {
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

      const brands = await Brand.query()
        .whereNull('deleted_at')
        .if(search, (query) => {
          query.whereILike('name', `%${search}%`)
        })
        .orderBy('name', 'asc')
        .paginate(page, perPage)

      return response.status(200).send({
        message: 'Success',
        serve: {
          data: brands.toJSON().data,
          ...brands.toJSON().meta,
        },
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async listByLetter({ response }: HttpContext) {
    try {
      const brands = await Brand.query().whereNull('deleted_at').orderBy('name', 'asc')

      const grouped = brands.reduce((acc: Record<string, any[]>, brand) => {
        const letter = brand.name.charAt(0).toUpperCase()
        if (!acc[letter]) acc[letter] = []
        acc[letter].push(brand)
        return acc
      }, {})

      const result = Object.keys(grouped)
        .sort()
        .map((letter) => ({
          letter,
          children: grouped[letter],
        }))

      return response.status(200).send({
        message: 'Success',
        serve: result,
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
      const payload = await request.validateUsing(createBrandValidator)

      const brand = await Brand.create({
        ...payload,
        slug: await Helpers.generateSlug(payload.name)
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Brand ${brand.name}`,
        menu: 'Brand',
        data: brand.toJSON(),
      })

      return response.status(201).send({
        message: 'Success',
        serve: brand,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async update({ response, params, request, auth }: HttpContext) {
    try {
      const { slug } = params
      const payload = await request.validateUsing(updateBrandValidator)

      const brand = await Brand.query().where('slug', slug).whereNull('deleted_at').first()

      if (!brand) {
        return response.status(404).send({
          message: 'Brand not found',
          serve: null,
        })
      }

      const oldData = brand.toJSON()

      brand.merge({
        name: payload.name ?? brand.name,
        slug: payload.name ? await Helpers.generateSlug(payload.name) : brand.slug,
        description: payload.description ?? brand.description,
        logoUrl: payload.logoUrl ?? brand.logoUrl,
        bannerUrl: payload.bannerUrl ?? brand.bannerUrl,
        country: payload.country ?? brand.country,
        website: payload.website ?? brand.website,
        isActive: payload.isActive ?? brand.isActive,
      })

      await brand.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Brand ${oldData.name}`,
        menu: 'Brand',
        data: { old: oldData, new: brand.toJSON() },
      })

      return response.status(200).send({
        message: 'Success',
        serve: brand,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const { slug } = params
      const brand = await Brand.query().where('slug', slug).whereNull('deleted_at').first()

      if (!brand) {
        return response.status(404).send({
          message: 'Brand not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: brand,
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
      const { slug } = params

      const brand = await Brand.query().where('slug', slug).first()

      if (!brand) {
        return response.status(404).send({
          message: 'Brand not found',
          serve: null,
        })
      }

      await brand.delete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Banner`,
        menu: 'Banner',
        data: brand.toJSON(),
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
