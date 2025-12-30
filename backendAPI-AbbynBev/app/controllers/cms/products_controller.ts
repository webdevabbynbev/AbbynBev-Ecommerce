import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import db from '@adonisjs/lucid/services/db'
import { createProduct, updateProduct } from '#validators/product'
import ProductMedia from '#models/product_media'
import ProductVariant from '#models/product_variant'
import ProductDiscount from '#models/product_discount'
import VariantAttribute from '#models/variant_attribute'
import emitter from '@adonisjs/core/services/emitter'
import env from '#start/env'
import OpenAI from 'openai'
import { generateSlug } from '../../utils/helpers.js'
import CategoryType from '#models/category_type'
import { DateTime } from 'luxon'
import ProductOnline from '#models/product_online'

export default class ProductsController {
  public async get({ response, request }: HttpContext) {
    try {
      const { name = '', isFlashsale, status, page: p, per_page: pp } = request.qs()
      const page = Number(p) > 0 ? Number(p) : 1
      const per_page = Number(pp) > 0 ? Number(pp) : 10

      const dataProduct = await Product.query()
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
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const productId = params.id
      const dataProduct = await Product.query()
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
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const data = request.all()
      await createProduct.validate(data)

      const dataProduct = new Product()
      dataProduct.name = request.input('name')
      dataProduct.slug = await generateSlug(request.input('name'))
      dataProduct.description = request.input('description')
      dataProduct.weight = request.input('weight')
      dataProduct.basePrice = request.input('base_price')

      dataProduct.status = request.input('status') || 'draft'
      dataProduct.isFlashsale =
        dataProduct.status === 'draft' ? false : request.input('is_flashsale') || false

      dataProduct.categoryTypeId = request.input('category_type_id')
      dataProduct.brandId = request.input('brand_id')
      dataProduct.personaId = request.input('persona_id')

      dataProduct.masterSku = request.input('master_sku')

      const category = await CategoryType.find(request.input('category_type_id'))
      const categorySlug = category
        ? await generateSlug(category.name)
        : `category-${request.input('category_type_id')}`

      dataProduct.path = `${categorySlug}/${dataProduct.slug}`

      if (request.input('meta_ai') === 1) {
        const meta = await this.generateMeta({
          productName: request.input('name'),
          productDescription: request.input('description'),
        })
        if (meta) {
          dataProduct.metaTitle = meta.metaTitle
          dataProduct.metaDescription = meta.metaDescription
          dataProduct.metaKeywords = meta.metaKeywords
        }
      } else {
        dataProduct.metaTitle = request.input('meta_title')
        dataProduct.metaDescription = request.input('meta_description')
        dataProduct.metaKeywords = request.input('meta_keywords')
      }

      await dataProduct.save()

      if (request.input('tag_ids')?.length > 0) {
        await dataProduct.related('tags').sync(request.input('tag_ids'))
      }
      if (request.input('concern_option_ids')?.length > 0) {
        await dataProduct.related('concernOptions').sync(request.input('concern_option_ids'))
      }
      if (request.input('profile_category_option_ids')?.length > 0) {
        await dataProduct
          .related('profileOptions')
          .sync(request.input('profile_category_option_ids'))
      }

      if (request.input('medias')?.length > 0) {
        for (const value of request.input('medias')) {
          await ProductMedia.create({
            productId: dataProduct.id,
            url: this.extractFileName(value.url),
            type: value.type,
            altText: dataProduct.name,
          })
        }
      }

      if (request.input('discounts')?.length > 0) {
        for (const value of request.input('discounts')) {
          await ProductDiscount.create({
            productId: dataProduct.id,
            type: value.type,
            value: value.value,
            maxValue: value.max_value,
            startDate: value.start_date,
            endDate: value.end_date,
          })
        }
      }

      if (request.input('variants')?.length > 0) {
        for (const value of request.input('variants')) {
          const scannedBarcode = value.barcode
          const masterSku = dataProduct.masterSku || `PRD-${dataProduct.id}`
          const variantSku = await this.generateVariantSku(masterSku, scannedBarcode)

          const createdVariant = await ProductVariant.create({
            productId: dataProduct.id,
            sku: variantSku,
            barcode: scannedBarcode,
            price: value.price,
            stock: value.stock,
          })

          if (value.combination?.length > 0) {
            for (const attribute of value.combination) {
              await VariantAttribute.create({
                productVariantId: createdVariant.id,
                attributeValueId: attribute,
              })
            }
          }
        }
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Product`,
        menu: 'Product',
        data: dataProduct.toJSON(),
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Successfully created.',
        serve: dataProduct,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async update({ response, request, params, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const data = request.all()
      await updateProduct.validate(data)

      const dataProduct = await Product.find(params.id)
      if (!dataProduct) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      const oldData = dataProduct.toJSON()

      dataProduct.name = request.input('name')
      dataProduct.slug = await generateSlug(request.input('name'))
      dataProduct.description = request.input('description')
      dataProduct.weight = request.input('weight')
      dataProduct.basePrice = request.input('base_price')
      dataProduct.status = request.input('status') || dataProduct.status
      dataProduct.isFlashsale =
        dataProduct.status === 'draft' ? false : request.input('is_flashsale') || false
      dataProduct.categoryTypeId = request.input('category_type_id')
      dataProduct.brandId = request.input('brand_id')
      dataProduct.personaId = request.input('persona_id')
      dataProduct.masterSku = request.input('master_sku') || dataProduct.masterSku

      const category = await CategoryType.find(request.input('category_type_id'))
      const categorySlug = category
        ? await generateSlug(category.name)
        : `category-${request.input('category_type_id')}`

      dataProduct.path = `${categorySlug}/${dataProduct.slug}`

      await dataProduct.save()

      if (request.input('tag_ids')?.length > 0) {
        await dataProduct.related('tags').sync(request.input('tag_ids'))
      }
      if (request.input('concern_option_ids')?.length > 0) {
        await dataProduct.related('concernOptions').sync(request.input('concern_option_ids'))
      }
      if (request.input('profile_category_option_ids')?.length > 0) {
        await dataProduct
          .related('profileOptions')
          .sync(request.input('profile_category_option_ids'))
      }
      if (request.input('variants')?.length > 0) {
        const incomingIds = (request.input('variants') as { id?: number }[])
          .filter((v) => v.id)
          .map((v) => v.id as number)

        for (const value of request.input('variants')) {
          if (value.id) {
            const variant = await ProductVariant.find(value.id)
            if (variant) {
              variant.price = value.price
              variant.stock = value.stock
              variant.barcode = value.barcode

              const masterSku = dataProduct.masterSku || `PRD-${dataProduct.id}`
              variant.sku = await this.generateVariantSku(masterSku, variant.barcode)

              await variant.save()

              if (value.combination?.length > 0) {
                await variant.related('attributes').sync(value.combination)
              }
            }
          } else {
            const masterSku = dataProduct.masterSku || `PRD-${dataProduct.id}`
            const variantSku = await this.generateVariantSku(masterSku, value.barcode)

            const newVariant = await ProductVariant.create({
              productId: dataProduct.id,
              sku: variantSku,
              barcode: value.barcode,
              price: value.price,
              stock: value.stock,
            })
            if (value.combination?.length > 0) {
              await newVariant.related('attributes').sync(value.combination)
            }
          }
        }

        await ProductVariant.query()
          .where('product_id', dataProduct.id)
          .whereNotIn('id', incomingIds)
          .delete()
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Product`,
        menu: 'Product',
        data: { old: oldData, new: dataProduct.toJSON() },
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Successfully updated.',
        serve: dataProduct,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const product = await Product.find(params.id)
      if (product) {
        await product.softDelete()

        // @ts-ignore
        await emitter.emit('set:activity-log', {
          roleName: auth.user?.role_name,
          userName: auth.user?.name,
          activity: `Delete Product`,
          menu: 'Product',
          data: product.toJSON(),
        })

        await trx.commit()
        return response.status(200).send({
          message: 'Successfully deleted.',
          serve: [],
        })
      } else {
        await trx.commit()
        return response.status(422).send({
          message: 'Invalid data.',
          serve: [],
        })
      }
    } catch (error) {
      await trx.rollback()
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
      const dataProduct = await Product.query()
        .apply((scopes) => scopes.active())
        .where('is_flashsale', true)
        .where('status', '!=', 'draft')
        .orderBy('products.created_at', 'desc')

      return response.status(200).send({
        message: 'success',
        serve: dataProduct.map((p) => p.toJSON()),
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateProductIndex({ request, response }: HttpContext) {
    const updates = request.input('updates')
    const batchSize = 100

    try {
      for (const update of updates) {
        const { id, order: newPosition } = update
        await Product.query().where('id', id).update({ position: newPosition })
      }

      let page = 1
      let hasMore = true

      while (hasMore) {
        const products = await Product.query().orderBy('position', 'asc').paginate(page, batchSize)

        if (products.all().length === 0) {
          hasMore = false
          break
        }

        for (let i = 0; i < products.all().length; i++) {
          const product = products.all()[i]
          const newPosition = (page - 1) * batchSize + i
          if (product.position !== newPosition) {
            await Product.query().where('id', product.id).update({ position: newPosition })
          }
        }

        page++
      }

      return response.status(200).send({
        message: 'Positions updated and reordered successfully.',
        serve: [],
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async publish({ params, response, auth }: HttpContext) {
    try {
      const product = await Product.find(params.id)

      if (!product) {
        return response.status(404).send({ message: 'Product not found' })
      }

      if (product.status === 'draft') {
        return response.status(400).send({
          message: 'Product is still draft, cannot publish',
        })
      }
      const published = await ProductOnline.updateOrCreate(
        { productId: product.id },
        { isActive: true, publishedAt: DateTime.now() }
      )

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Publish Product`,
        menu: 'Product',
        data: { product: product.toJSON(), published: published.toJSON() },
      })

      return response.status(200).send({
        message: 'Product published successfully',
        serve: published,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }

  public async unpublish({ params, response, auth }: HttpContext) {
    try {
      const productOnline = await ProductOnline.query().where('product_id', params.id).first()

      if (!productOnline) {
        return response.status(404).send({ message: 'Product not found in online table' })
      }

      productOnline.isActive = false
      await productOnline.save()

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
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
      })
    }
  }
}
