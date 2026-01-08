import type { HttpContext } from '@adonisjs/core/http'
import { parse } from 'csv-parse'
import fs from 'node:fs'
import Product from '#models/product'

export default class ProductCsvImportController {
  public async import({ request, response,}: HttpContext) {
    const file = request.file('file', {
      extnames: ['csv'],
      size: '5mb',
    })

    if (!file || !file.tmpPath) {
      return response.badRequest({
        message: 'File CSV wajib diupload',
      })
    }

    const records: any[] = []

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(file.tmpPath!)
          .pipe(
            parse({
              columns: true,
              skip_empty_lines: true,
              trim: true,
            })
          )
          .on('data', (row) => records.push(row))
          .on('end', resolve)
          .on('error', reject)
      })

      let success = 0
      let failed = 0

      for (const row of records) {
        try {
          await Product.create({
            masterSku: row.master_sku,
            name: row.name,
            slug: row.slug,
            description: row.description,
            basePrice: Number(row.base_price),
            weight: Number(row.weight),
            isFlashsale: Boolean(Number(row.is_flash_sale)),
            status: row.status ?? 'draft',
            categoryTypeId: Number(row.category_type_id),
            brandId: Number(row.brand_id),
            personaId: Number(row.persona_id),
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            metaKeywords: row.meta_keywords,
            popularity: Number(row.popularity ?? 0),
            position: Number(row.position ?? 0),
          })

          success++
        } catch {
          failed++
        }
      }

      return response.ok({
        message: 'Import CSV selesai',
        result: {
          total: records.length,
          success,
          failed,
        },
      })
    } catch (error: any) {
      return response.internalServerError({
        message: 'Gagal memproses CSV',
        error: error.message,
      })
    } finally {
      fs.unlink(file.tmpPath!, () => {})
    }
  }
}
