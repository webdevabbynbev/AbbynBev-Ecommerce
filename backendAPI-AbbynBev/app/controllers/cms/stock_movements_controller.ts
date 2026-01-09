import type { HttpContext } from '@adonisjs/core/http'
import StockMovement from '#models/stock_movement'
import ProductVariant from '#models/product_variant'
import emitter from '@adonisjs/core/services/emitter'
import ExcelJS from 'exceljs'

export default class StockMovementsController {
  public async get({ response, request, auth }: HttpContext) {
    try {
      const page = Number(request.input('page', 1))
      const perPage = Number(request.input('per_page', 20))

      const productId = request.input('product_id')
      const variantId = request.input('variant_id')
      const type = request.input('type')
      const dateFrom = request.input('date_from')
      const dateTo = request.input('date_to')

      const query = StockMovement.query()
        .preload('variant', (q) => q.preload('product'))
        .orderBy('created_at', 'desc')

      if (variantId) query.where('product_variant_id', variantId)
      if (productId) query.whereHas('variant', (q) => q.where('product_id', productId))
      if (type) query.where('type', type)
      if (dateFrom) query.where('created_at', '>=', dateFrom + ' 00:00:00')
      if (dateTo) query.where('created_at', '<=', dateTo + ' 23:59:59')

      const logs = await query.paginate(page, perPage)

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `View Stock Movements`,
        menu: 'Stock Movements',
        data: { productId, variantId, type, dateFrom, dateTo, page, perPage },
      })

      return response.ok({
        message: 'success',
        serve: logs,
      })
    } catch (error) {
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }

  public async adjust({ request, response, auth }: HttpContext) {
    try {
      const variantId = request.input('variant_id')
      const change = Number(request.input('change'))
      const note = request.input('note') || 'Manual adjustment'

      const variant = await ProductVariant.find(variantId)
      if (!variant) {
        return response.status(404).send({ message: 'Variant not found' })
      }

      await variant.adjustStock(change, 'adjustment', undefined, note)

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Manual Stock Adjustment`,
        menu: 'Stock Movements',
        data: { variantId: variant.id, change, note },
      })

      return response.ok({ message: 'Stock adjusted successfully', serve: variant })
    } catch (error) {
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }

  public async export({ response, request, auth }: HttpContext) {
    try {
      const format = (request.input('format') || 'excel').toLowerCase()
      const productId = request.input('product_id')
      const variantId = request.input('variant_id')
      const type = request.input('type')
      const dateFrom = request.input('date_from')
      const dateTo = request.input('date_to')

      const query = StockMovement.query()
        .preload('variant', (q) => q.preload('product'))
        .orderBy('created_at', 'desc')

      if (variantId) query.where('product_variant_id', variantId)
      if (productId) query.whereHas('variant', (q) => q.where('product_id', productId))
      if (type) query.where('type', type)
      if (dateFrom) query.where('created_at', '>=', dateFrom + ' 00:00:00')
      if (dateTo) query.where('created_at', '<=', dateTo + ' 23:59:59')

      const logs = await query

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Export Stock Movements (${format.toUpperCase()})`,
        menu: 'Stock Movements',
        data: { productId, variantId, type, dateFrom, dateTo, format },
      })

      if (format === 'csv') {
        let csv = 'ID,Product,Variant SKU,Barcode,Change,Type,Note,Date\n'
        logs.forEach((log) => {
          csv +=
            [
              log.id,
              log.variant?.product?.name || '-',
              log.variant?.sku || '-',
              log.variant?.barcode || '-',
              log.change,
              log.type,
              `"${log.note || '-'}"`,
              log.createdAt.toFormat('yyyy-MM-dd HH:mm'),
            ].join(',') + '\n'
        })

        response.header('Content-Type', 'text/csv')
        response.header(
          'Content-Disposition',
          `attachment; filename="stock_movements_${Date.now()}.csv"`
        )
        return response.send(csv)
      } else {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Stock Movements')

        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Product', key: 'product', width: 30 },
          { header: 'Variant SKU', key: 'sku', width: 20 },
          { header: 'Barcode', key: 'barcode', width: 20 },
          { header: 'Change', key: 'change', width: 10 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Note', key: 'note', width: 30 },
          { header: 'Date', key: 'date', width: 20 },
        ]

        logs.forEach((log) => {
          worksheet.addRow({
            id: log.id,
            product: log.variant?.product?.name || '-',
            sku: log.variant?.sku || '-',
            barcode: log.variant?.barcode || '-',
            change: log.change,
            type: log.type,
            note: log.note || '-',
            date: log.createdAt.toFormat('yyyy-MM-dd HH:mm'),
          })
        })

        response.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response.header(
          'Content-Disposition',
          `attachment; filename="stock_movements_${Date.now()}.xlsx"`
        )
        await workbook.xlsx.write(response.response)
        return response.response
      }
    } catch (error) {
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }
}
