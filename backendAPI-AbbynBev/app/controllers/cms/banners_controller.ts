import { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '../../utils/upload_file_service.js'
import Banner from '#models/banner'
import { createBanner, updateBanner } from '#validators/banner'
import emitter from '@adonisjs/core/services/emitter'

export default class BannersController {
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
      const banners = await Banner.query()
        .apply((scopes) => scopes.active())
        .if(search, (query) => {
          query.where((q) => {
            q.whereILike('title', `%${search}%`)
          })
        })
        .orderBy('order', 'asc')
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

  public async create({ response, request, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createBanner)

      let thumbnail = await FileUploadService.uploadFile(request.file('image'), {
        folder: 'banner',
        type: 'image',
      })
      let thumbnailMobile = await FileUploadService.uploadFile(request.file('image_mobile'), {
        folder: 'banner',
        type: 'image_mobile',
      })

      const totalBanner: Banner | null = await Banner.query()
        .whereNull('deletedAt')
        .count('* as total')
        .first()
      const orderNewBanner: number = (totalBanner?.$extras?.total || 0) + 1

      const banner: Banner = await Banner.create({
        title: payload.title,
        description: payload.description,
        hasButton: payload.has_button,
        position: payload.position,
        buttonUrl: payload.button_url,
        buttonText: payload.button_text,
        image: thumbnail,
        order: orderNewBanner,
        imageMobile: thumbnailMobile,
        createdBy: auth.user?.id,
        updatedBy: auth.user?.id,
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Banner`,
        menu: 'Banner',
        data: banner.toJSON(),
      })

      return response.status(201).send({
        message: 'Success',
        serve: banner,
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

      const payload = await request.validateUsing(updateBanner)
      let image
      let imageMobile = null
      const banner: Banner | null = (await Banner.findWithSoftDelete(id)) as Banner

      if (!banner) {
        return response.status(404).send({
          message: 'Banner not found',
          serve: null,
        })
      }

      const oldBanner = banner.toJSON()

      if (request.file('image')) {
        image = await FileUploadService.uploadFile(request.file('image'), { folder: 'banner', type: 'image' })
      }
      if (request.file('image_mobile')) {
        imageMobile = await FileUploadService.uploadFile(request.file('image_mobile'), {
          folder: 'banner',
          type: 'image_mobile',
        })
      }

      let data = {
        title: payload.title,
        description: payload.description,
        position: payload.position,
        hasButton: payload.has_button,
        buttonUrl: payload.button_url,
        buttonText: payload.button_text,
        updatedBy: auth.user?.id,
      }

      if (image) {
        Object.assign(data, {
          image: image,
        })
      }

      if (imageMobile) {
        Object.assign(data, {
          imageMobile: imageMobile,
        })
      }

      banner.merge(data)

      await banner.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Banner`,
        menu: 'Banner',
        data: { old: oldBanner, new: banner.toJSON() },
      })

      return response.status(200).send({
        message: 'Success',
        serve: true,
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

      const banner: Banner | null = await Banner.query()
        .apply((scopes) => scopes.active())
        .where('id', id)
        .first()

      if (!banner) {
        return response.status(404).send({
          message: 'Banner not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: banner,
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

      const banner: Banner | null = (await Banner.findWithSoftDelete(id)) as Banner

      if (!banner) {
        return response.status(404).send({
          message: 'Banner not found',
          serve: null,
        })
      }

      await banner.delete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Banner`,
        menu: 'Banner',
        data: banner.toJSON(),
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

  public async updateProductIndex({ request, response }: HttpContext) {
    const updates = request.input('updates')
    const batchSize = 100

    try {
      for (const update of updates) {
        const { id, order: newPosition } = update

        await Banner.query().where('id', id).update({ order: newPosition })
      }

      let page = 1
      let hasMore = true

      while (hasMore) {
        const products = await Banner.query().orderBy('order', 'asc').paginate(page, batchSize)

        if (products.all().length === 0) {
          hasMore = false
          break
        }

        for (let i = 0; i < products.all().length; i++) {
          const product = products.all()[i]
          const newPosition = (page - 1) * batchSize + i
          if (product.order !== newPosition) {
            await Banner.query().where('id', product.id).update({ order: newPosition })
          }
        }

        page++
      }

      return response.status(200).send({
        message: 'Banner updated and reordered successfully.',
        serve: [],
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
