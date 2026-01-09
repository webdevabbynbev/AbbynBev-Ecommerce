import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { assignTagValidator } from '#validators/product_tag'
import emitter from '@adonisjs/core/services/emitter'

export default class ProductTagsController {
  public async list({ response, params }: HttpContext) {
    try {
      const { productId } = params
      const product = await Product.query().where('id', productId).preload('tags').firstOrFail()

      return response.status(200).send({
        message: 'Success',
        serve: product.tags,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async assign({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(assignTagValidator)

      const product = await Product.findOrFail(payload.productId)
      await product.related('tags').attach({
        [payload.tagId]: {
          start_date: payload.start_date,
          end_date: payload.end_date,
        },
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Assign Tag ${payload.tagId} ke Product ${payload.productId}`,
        menu: 'Product Tag',
        data: payload,
      })

      return response.status(201).send({
        message: 'Tag assigned successfully',
        serve: true,
      })
    } catch (e) {
      if (e.status === 422) {
        return response.status(422).send({
          message: e.messages || 'Validation error',
          serve: e.messages,
        })
      }

      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async unassign({ request, response, auth }: HttpContext) {
    try {
      const { productId, tagId } = request.only(['productId', 'tagId'])

      const product = await Product.findOrFail(productId)
      await product.related('tags').detach([tagId])

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Unassign Tag ${tagId} dari Product ${productId}`,
        menu: 'Product Tag',
        data: { productId, tagId },
      })

      return response.status(200).send({
        message: 'Tag unassigned successfully',
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
