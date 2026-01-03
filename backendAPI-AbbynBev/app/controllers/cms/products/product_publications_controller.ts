import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { ProductCmsService } from '#services/product/product_cms_service'

export default class ProductPublicationsController {
  private cms = new ProductCmsService()

  public async publish({ params, response, auth }: HttpContext) {
    try {
      const result = await this.cms.publish(Number(params.id))

      if (result.reason === 'NOT_FOUND') return response.status(404).send({ message: 'Product not found' })
      if (result.reason === 'DRAFT')
        return response.status(400).send({ message: 'Product is still draft, cannot publish' })

      await (emitter as any).emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Publish Product`,
        menu: 'Product',
        data: { product: result.product?.toJSON(), published: result.online?.toJSON() },
      })

      return response.status(200).send({ message: 'Product published successfully', serve: result.online })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }

  public async unpublish({ params, response, auth }: HttpContext) {
    try {
      const productOnline = await this.cms.unpublish(Number(params.id))
      if (!productOnline) return response.status(404).send({ message: 'Product not found in online table' })

      await (emitter as any).emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Unpublish Product`,
        menu: 'Product',
        data: productOnline.toJSON(),
      })

      return response.status(200).send({ message: 'Product unpublished successfully', serve: productOnline })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }
}
