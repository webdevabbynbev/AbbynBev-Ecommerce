import type { HttpContext } from '@adonisjs/core/http'
import Sale from '#models/sale'
import SaleProduct from '#models/sale_product'
import { createSaleValidator, updateSaleValidator } from '#validators/sale'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'

export default class SalesController {
  public async get({ response }: HttpContext) {
    const sales = await Sale.query()
      .preload('products', (q) => {
        q.pivotColumns(['sale_price', 'stock'])
      })
      .orderBy('start_datetime', 'desc')

    return response.status(200).send({
      message: 'Success',
      serve: sales,
    })
  }

  public async show({ params, response }: HttpContext) {
    const sale = await Sale.query()
      .where('id', params.id)
      .preload('products', (q) => {
        q.pivotColumns(['sale_price', 'stock'])
      })
      .first()

    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: sale,
    })
  }

  public async create({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createSaleValidator)

    const trx = await db.transaction()

    try {
      const sale = await Sale.create(
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

      if (payload.products?.length) {
        for (const p of payload.products) {
          await SaleProduct.create(
            {
              saleId: sale.id,
              productId: p.product_id,
              salePrice: p.sale_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Sale ${sale.title}`,
        menu: 'Sale',
        data: sale.toJSON(),
      })

      return response.status(201).send({
        message: 'Sale created successfully',
        serve: sale,
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
    const payload = await request.validateUsing(updateSaleValidator)

    const sale = await Sale.find(params.id)
    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = sale.toJSON()

      sale.merge({
        title: payload.title ?? sale.title,
        description: payload.description ?? sale.description,
        hasButton: payload.has_button ?? sale.hasButton,
        buttonText: payload.button_text ?? sale.buttonText,
        buttonUrl: payload.button_url ?? sale.buttonUrl,
        startDatetime: payload.start_datetime
          ? DateTime.fromJSDate(payload.start_datetime)
          : sale.startDatetime,
        endDatetime: payload.end_datetime ? DateTime.fromJSDate(payload.end_datetime) : sale.endDatetime,
        isPublish: payload.is_publish ?? sale.isPublish,
        updatedBy: auth.user?.id,
      })

      await sale.useTransaction(trx).save()

      if (payload.products?.length) {
        await SaleProduct.query({ client: trx }).where('sale_id', sale.id).delete()

        for (const p of payload.products) {
          await SaleProduct.create(
            {
              saleId: sale.id,
              productId: p.product_id,
              salePrice: p.sale_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Sale ${oldData.title}`,
        menu: 'Sale',
        data: { old: oldData, new: sale.toJSON() },
      })

      return response.status(200).send({
        message: 'Sale updated successfully',
        serve: sale,
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
    const sale = await Sale.find(params.id)
    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    const oldData = sale.toJSON()
    await sale.delete()

    // @ts-ignore
    await emitter.emit('set:activity-log', {
      roleName: auth.user?.role_name,
      userName: auth.user?.name,
      activity: `Delete Sale ${oldData.title}`,
      menu: 'Sale',
      data: oldData,
    })

    return response.status(200).send({
      message: 'Sale deleted successfully',
      serve: true,
    })
  }
}