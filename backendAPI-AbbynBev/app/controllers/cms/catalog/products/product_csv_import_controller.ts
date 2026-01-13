import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import ProductCsvImportService from '#services/product_csv_import_services'

function cleanupFile(filePath?: string) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}
}

export default class ProductCsvImportController {
  async import({ request, response }: HttpContext) {
    const file = request.file('file', { extnames: ['csv'], size: '20mb' })
    if (!file || !file.tmpPath) {
      return response.badRequest({ message: 'File CSV tidak ditemukan' })
    }

    const filePath = file.tmpPath
    const service = new ProductCsvImportService()

    try {
      const result = await service.import(filePath)
      return response.ok(result)
    } catch (err: any) {
      return response.internalServerError({ message: err.message || 'Gagal import CSV' })
    } finally {
      cleanupFile(filePath)
    }
  }
}