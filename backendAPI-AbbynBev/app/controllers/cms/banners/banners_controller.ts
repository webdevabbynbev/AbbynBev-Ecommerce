import type { HttpContext } from '@adonisjs/core/http'
import FileUploadService from '../../../utils/upload_file_service.js'
import Banner from '#models/banner'
import { createBanner, updateBanner } from '#validators/banner'
import { ActivityLogService } from '#services/activity_log_service'

export default class BannersController {
  public async get({ response, request }: HttpContext) {
    try {
      const qs = request.qs()
      const search: string = qs?.q
      const page = Number.isNaN(Number.parseInt(qs.page)) ? 1 : Number.parseInt(qs.page)
      const perPage = Number.isNaN(Number.parseInt(qs.per_page)) ? 10 : Number.parseInt(qs.per_page)

      const banners = await Banner.query()
        .apply((scopes) => scopes.active())
        .if(search, (query) => {
          query.where((q) => q.whereILike('title', `%${search}%`))
        })
        .orderBy('order', 'asc')
        .paginate(page, perPage)

      const meta = banners.toJSON().meta

      return response.status(200).send({
        message: 'Success',
        serve: { data: banners.toJSON().data, ...meta },
      })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createBanner)

      const image = await FileUploadService.uploadFile(request.file('image'), {
        folder: 'banner',
        type: 'image',
      })
      const imageMobile = await FileUploadService.uploadFile(request.file('image_mobile'), {
        folder: 'banner',
        type: 'image_mobile',
      })

      const total = await Banner.query()
        .apply((scopes) => scopes.active())
        .count('* as total')
        .first()

      const orderNewBanner = Number(total?.$extras?.total || 0) + 1

      const banner = await Banner.create({
        title: payload.title,
        description: payload.description,
        hasButton: payload.has_button,
        position: payload.position,
        buttonUrl: payload.button_url,
        buttonText: payload.button_text,
        image,
        imageMobile,
        order: orderNewBanner,
        createdBy: auth.user?.id,
        updatedBy: auth.user?.id,
      })

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Create Banner',
        menu: 'Banner',
        data: banner.toJSON(),
      })

      return response.status(201).send({ message: 'Success', serve: banner })
    } catch (e: any) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async update({ response, params, request, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateBanner)
      const banner = (await Banner.findWithSoftDelete(params.id)) as Banner | null

      if (!banner) return response.status(404).send({ message: 'Banner not found', serve: null })

      const oldBanner = banner.toJSON()

      let image: string | undefined
      let imageMobile: string | undefined

      if (request.file('image')) {
        image = await FileUploadService.uploadFile(request.file('image'), { folder: 'banner', type: 'image' })
      }
      if (request.file('image_mobile')) {
        imageMobile = await FileUploadService.uploadFile(request.file('image_mobile'), {
          folder: 'banner',
          type: 'image_mobile',
        })
      }

      const data: any = {
        title: payload.title,
        description: payload.description,
        position: payload.position,
        hasButton: payload.has_button,
        buttonUrl: payload.button_url,
        buttonText: payload.button_text,
        updatedBy: auth.user?.id,
      }

      if (image) data.image = image
      if (imageMobile) data.imageMobile = imageMobile

      banner.merge(data)
      await banner.save()

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Update Banner',
        menu: 'Banner',
        data: { old: oldBanner, new: banner.toJSON() },
      })

      return response.status(200).send({ message: 'Success', serve: true })
    } catch (e: any) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const banner = await Banner.query().apply((scopes) => scopes.active()).where('id', params.id).first()
      if (!banner) return response.status(404).send({ message: 'Banner not found', serve: null })
      return response.status(200).send({ message: 'Success', serve: banner })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    try {
      const banner = (await Banner.findWithSoftDelete(params.id)) as Banner | null
      if (!banner) return response.status(404).send({ message: 'Banner not found', serve: null })

      await banner.delete()

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: 'Delete Banner',
        menu: 'Banner',
        data: banner.toJSON(),
      })

      return response.status(200).send({ message: 'Success', serve: true })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }
}
