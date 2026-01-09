import type { HttpContext } from '@adonisjs/core/http'
import FlashSale from '#models/flashsale'
import FlashSaleProduct from '#models/flashsale_product'
import { createFlashSaleValidator, updateFlashSaleValidator } from '#validators/flashsale'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'
import { PromoFlagService } from '#services/promo/promo_flag_service'

export default class FlashsalesController {
  private promoFlag = new PromoFlagService()

  public async get({ response }: HttpContext) {
    const flashSales = await FlashSale.query()
      .preload('products', (q) => {
        q.pivotColumns(['flash_price', 'stock'])
      })
      .orderBy('start_datetime', 'desc')

    return response.status(200).send({
      message: 'Success',
      serve: flashSales,
    })
  }

  public async show({ params, response }: HttpContext) {
    const flashSale = await FlashSale.query()
      .where('id', params.id)
      .preload('products', (q) => {
        q.pivotColumns(['flash_price', 'stock'])
      })
      .first()

    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: flashSale,
    })
  }

  public async create({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createFlashSaleValidator)
    const trx = await db.transaction()

    try {
      const flashSale = await FlashSale.create(
        {
          title: payload.title,
          description: payload.description,
          hasButton: payload.has_button,
          buttonText: payload.button_text,
          buttonUrl: payload.button_url,
          startDatetime: DateTime.fromJSDate(payload.start_datetime),
          endDatetime: DateTime.fromJSDate(payload.end_datetime),
          isPublish: payload.is_publish,
          createdBy: auth.user?.id,
          updatedBy: auth.user?.id,
        },
        { client: trx }
      )

      const productIds: number[] = []

      if (payload.products?.length) {
        for (const p of payload.products) {
          productIds.push(Number(p.product_id))
          await FlashSaleProduct.create(
            {
              flashSaleId: flashSale.id,
              productId: p.product_id,
              flashPrice: p.flash_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      // ✅ sync flag is_flash_sale untuk produk yg di-assign flash sale
      if (productIds.length) {
        await this.promoFlag.syncFlashSaleFlags(productIds, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Flash Sale ${flashSale.title}`,
        menu: 'Flash Sale',
        data: flashSale.toJSON(),
      })

      return response.status(201).send({
        message: 'Flash Sale created successfully',
        serve: flashSale,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateFlashSaleValidator)

    const flashSale = await FlashSale.find(params.id)
    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = flashSale.toJSON()

      const oldRows = await db
      .from('flashsale_products')
      .useTransaction(trx)
      .where('flash_sale_id', flashSale.id)
      .select('product_id')

const oldIds = oldRows.map((r) => Number(r.product_id))


      flashSale.merge({
        title: payload.title ?? flashSale.title,
        description: payload.description ?? flashSale.description,
        hasButton: payload.has_button ?? flashSale.hasButton,
        buttonText: payload.button_text ?? flashSale.buttonText,
        buttonUrl: payload.button_url ?? flashSale.buttonUrl,
        startDatetime: payload.start_datetime
          ? DateTime.fromJSDate(payload.start_datetime)
          : flashSale.startDatetime,
        endDatetime: payload.end_datetime
          ? DateTime.fromJSDate(payload.end_datetime)
          : flashSale.endDatetime,
        isPublish: payload.is_publish ?? flashSale.isPublish,
        updatedBy: auth.user?.id,
      })

      await flashSale.useTransaction(trx).save()

      // ✅ kalau products dikirim (meskipun []), berarti replace pivot
      const productsProvided = payload.products !== undefined
      let newIds: number[] = oldIds

      if (productsProvided) {
        await FlashSaleProduct.query({ client: trx }).where('flash_sale_id', flashSale.id).delete()

        newIds = []
        for (const p of payload.products || []) {
          newIds.push(Number(p.product_id))
          await FlashSaleProduct.create(
            {
              flashSaleId: flashSale.id,
              productId: p.product_id,
              flashPrice: p.flash_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      // ✅ sync flag:
      // - kalau ada perubahan publish/date, tetap update produk yang terkait
      // - kalau produk berubah, union old+new supaya yang dilepas ikut di-reset
      const affectedIds = Array.from(new Set([...(oldIds || []), ...(newIds || [])])).filter(Boolean)

      if (affectedIds.length) {
        await this.promoFlag.syncFlashSaleFlags(affectedIds, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Flash Sale ${oldData.title}`,
        menu: 'Flash Sale',
        data: { old: oldData, new: flashSale.toJSON() },
      })

      return response.status(200).send({
        message: 'Flash Sale updated successfully',
        serve: flashSale,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    const flashSale = await FlashSale.find(params.id)
    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = flashSale.toJSON()

      const rows = await db
      .from('flashsale_products')
      .useTransaction(trx)
      .where('flash_sale_id', flashSale.id)
      .select('product_id')

const ids = rows.map((r) => Number(r.product_id))

      await FlashSaleProduct.query({ client: trx }).where('flash_sale_id', flashSale.id).delete()

      await flashSale.useTransaction(trx).delete()

      if (ids.length) {
        await this.promoFlag.syncFlashSaleFlags(ids, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Flash Sale ${oldData.title}`,
        menu: 'Flash Sale',
        data: oldData,
      })

      return response.status(200).send({
        message: 'Flash Sale deleted successfully',
        serve: true,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
