import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { createProduct, updateProduct } from '#validators/product'
import { ProductService } from '#services/product/product_service'
import { ProductCmsService } from '#services/product/product_cms_service'
import type { CmsProductUpsertPayload } from '#services/product/product_cms_service'

export default class ProductsController {
  private productService = new ProductService()
  private cms = new ProductCmsService()

  public async get({ response, request }: HttpContext) {
    try {
      const { name = '', isFlashsale, status, page: p, per_page: pp } = request.qs()
      const page = Number(p) > 0 ? Number(p) : 1
      const per_page = Number(pp) > 0 ? Number(pp) : 10

      const dataProduct = await this.productService
        .query()
        .apply((scopes) => scopes.active())
        .if(name, (q) => q.where('products.name', 'like', `%${name}%`))
        .if(isFlashsale !== undefined && isFlashsale !== '', (q) =>
          q.where('products.is_flashsale', Boolean(Number(isFlashsale)))
        )
        .if(status, (q) => q.where('products.status', status))
        .preload('variants', (variantLoader) => {
          variantLoader.preload('attributes', (attributeLoader) => {
            attributeLoader
              .whereNull('attribute_values.deleted_at')
              .preload('attribute', (q) => q.whereNull('attributes.deleted_at'))
          })
        })
        .preload('discounts')
        .preload('medias')
        .preload('categoryType')
        .preload('brand')
        .preload('persona')
        .preload('tags')
        .preload('concernOptions')
        .preload('profileOptions')
        .orderByRaw('products.position IS NULL, products.position ASC')
        .paginate(page, per_page)

      const { meta, data } = dataProduct.toJSON()

      return response.status(200).send({
        message: 'success',
        serve: { data, ...meta },
      })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const productId = params.id

      const dataProduct = await this.productService
        .query()
        .apply((scopes) => scopes.active())
        .where('id', productId)
        .preload('variants', (variantLoader) => {
          variantLoader.preload('attributes', (attributeLoader) => {
            attributeLoader
              .whereNull('attribute_values.deleted_at')
              .preload('attribute', (q) => q.whereNull('attributes.deleted_at'))
          })
        })
        .preload('discounts')
        .preload('medias')
        .preload('categoryType')
        .preload('brand')
        .preload('persona')
        .preload('tags')
        .preload('concernOptions')
        .preload('profileOptions')
        .first()

      if (!dataProduct) return response.status(404).send({ message: 'Product not found', serve: null })

      return response.status(200).send({ message: 'success', serve: dataProduct })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const data = request.all() as unknown as CmsProductUpsertPayload
      await createProduct.validate(data)

      const created = await this.cms.create(data)

      await (emitter as any).emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Product`,
        menu: 'Product',
        data: created.toJSON(),
      })

      return response.status(200).send({ message: 'Successfully created.', serve: created })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }

  public async update({ response, request, params, auth }: HttpContext) {
    try {
      const data = request.all() as unknown as CmsProductUpsertPayload
      await updateProduct.validate(data)

      const before = await this.productService.find(Number(params.id))
      if (!before) return response.status(400).send({ message: 'Invalid data.', serve: [] })

      const oldData = before.toJSON()
      const updated = await this.cms.update(Number(params.id), data)

      if (!updated) return response.status(400).send({ message: 'Invalid data.', serve: [] })

      await (emitter as any).emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Product`,
        menu: 'Product',
        data: { old: oldData, new: updated.toJSON() },
      })

      return response.status(200).send({ message: 'Successfully updated.', serve: updated })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    try {
      const product = await this.cms.softDelete(Number(params.id))
      if (!product) return response.status(422).send({ message: 'Invalid data.', serve: [] })

      await (emitter as any).emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Product`,
        menu: 'Product',
        data: product.toJSON(),
      })

      return response.status(200).send({ message: 'Successfully deleted.', serve: [] })
    } catch (error: any) {
      return response.status(500).send({ message: error.message || 'Internal Server Error.', serve: [] })
    }
  }
}
