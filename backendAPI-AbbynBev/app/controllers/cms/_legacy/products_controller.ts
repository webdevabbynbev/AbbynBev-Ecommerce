import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import { createProduct, updateProduct } from '#validators/product'
import { ProductService } from '#services/product/product_service'
import { ProductCmsService } from '#services/product/product_cms_service'
import type { CmsProductUpsertPayload } from '#services/product/product_cms_service'
import ProductVariant from '#models/product_variant'
import env from '#start/env'
import OpenAI from 'openai'

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
        serve: {
          data,
          ...meta,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
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

      if (!dataProduct) {
        return response.status(404).send({
          message: 'Product not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'success',
        serve: dataProduct,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const data = request.all() as unknown as CmsProductUpsertPayload
      await createProduct.validate(data)

      const created = await this.cms.create(data)

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Product`,
        menu: 'Product',
        data: created.toJSON(),
      })

      return response.status(200).send({
        message: 'Successfully created.',
        serve: created,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async update({ response, request, params, auth }: HttpContext) {
    try {
      const data = request.all() as unknown as CmsProductUpsertPayload
      await updateProduct.validate(data)

      const before = await this.productService.find(Number(params.id))
      if (!before) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      const oldData = before.toJSON()
      const updated = await this.cms.update(Number(params.id), data)

      if (!updated) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Product`,
        menu: 'Product',
        data: { old: oldData, new: updated.toJSON() },
      })

      return response.status(200).send({
        message: 'Successfully updated.',
        serve: updated,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    try {
      const product = await this.cms.softDelete(Number(params.id))

      if (!product) {
        return response.status(422).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Product`,
        menu: 'Product',
        data: product.toJSON(),
      })

      return response.status(200).send({
        message: 'Successfully deleted.',
        serve: [],
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }


  private extractFileName(url: string) {
    if (url.startsWith('http')) {
      return url
    }
    const urlParts = url.split('/')
    const fileNameWithQuery = urlParts[urlParts.length - 1]
    return fileNameWithQuery.split('?')[0]
  }

  private async generateVariantSku(masterSku: string, barcode: string) {
    let baseSku = `${masterSku}-${barcode}`
    let existing = await ProductVariant.query().where('sku', baseSku).first()
    let counter = 1
    let sku = baseSku

    while (existing) {
      counter++
      sku = `${baseSku}-${counter}`
      existing = await ProductVariant.query().where('sku', sku).first()
    }

    return sku
  }

  private async generateMeta({
    productName,
    productDescription,
  }: {
    productName: string
    productDescription: string
  }) {
    const openai = new OpenAI({
      apiKey: env.get('OPENAI_API_KEY'),
    })

    if (!productName || !productDescription) return false

    try {
      const prompt = `
        Generate SEO meta tags for the following product with Indonesian language:
        Product Name: ${productName}
        Product Description: ${productDescription}

        Provide the result in this JSON format:
        {
          "metaTitle": "SEO optimized title",
          "metaDescription": "SEO optimized description",
          "metaKeywords": "comma-separated keywords"
        }
      `
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      })
      const result = JSON.parse(completion.choices[0].message.content || '{}')
      return {
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        metaKeywords: result.metaKeywords,
      }
    } catch (error) {
      console.error('Error generating meta tags:', error)
      return false
    }
  }

  public async getIsFlashsale({ response }: HttpContext) {
    try {
      const dataProduct = await this.productService
        .query()
        .apply((scopes) => scopes.active())
        .where('is_flashsale', true)
        .where('status', '!=', 'draft')
        .orderBy('products.created_at', 'desc')

      return response.status(200).send({
        message: 'success',
        serve: dataProduct.map((p) => p.toJSON()),
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateProductIndex({ request, response }: HttpContext) {
    try {
      const updates = request.input('updates') || []
      await this.cms.updatePositions(updates)

      return response.status(200).send({
        message: 'Positions updated and reordered successfully.',
        serve: [],
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async publish({ params, response, auth }: HttpContext) {
    try {
      const result = await this.cms.publish(Number(params.id))

      if (result.reason === 'NOT_FOUND') return response.status(404).send({ message: 'Product not found' })
      if (result.reason === 'DRAFT')
        return response.status(400).send({ message: 'Product is still draft, cannot publish' })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Publish Product`,
        menu: 'Product',
        data: { product: result.product?.toJSON(), published: result.online?.toJSON() },
      })

      return response.status(200).send({
        message: 'Product published successfully',
        serve: result.online,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }

  public async unpublish({ params, response, auth }: HttpContext) {
    try {
      const productOnline = await this.cms.unpublish(Number(params.id))

      if (!productOnline) return response.status(404).send({ message: 'Product not found in online table' })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Unpublish Product`,
        menu: 'Product',
        data: productOnline.toJSON(),
      })

      return response.status(200).send({
        message: 'Product unpublished successfully',
        serve: productOnline,
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }
}