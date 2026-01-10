import type { HttpContext } from '@adonisjs/core/http'
import csv from 'csv-parser'
import fs from 'fs'
import Product from '#models/product'
import slugify from 'slugify'
import { validateProductCsvRow } from '#validators/product_csv.validator'

export default class ProductCsvImportController {
  async import({ request, response, auth }: HttpContext) {
    const file = request.file('file', {
      extnames: ['csv'],
      size: '5mb',
    })

    if (!file || !file.tmpPath) {
      return response.badRequest({ message: 'File CSV tidak ditemukan' })
    }

    const filePath = file.tmpPath
    const products: any[] = []
    const errors: any[] = []

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
       .on('data', (row: any) => {
  try {
    validateProductCsvRow(row)

    products.push({
      name: row.name.trim(),

      slug:
        row.slug && row.slug !== ''
          ? row.slug
          : slugify.default(row.name, { lower: true, strict: true }),

      masterSku: row.master_sku || null,
      description: row.description || null,

      basePrice: Number(row.base_price) || 0,
      weight: Number(row.weight) || 0,

      isFlashSale: Number(row.is_flash_sale) === 1,
      status: row.status || 'normal',

      categoryTypeId: Number(row.category_type_id),
      brandId: row.brand_id ? Number(row.brand_id) : null,
      personaId: row.persona_id ? Number(row.persona_id) : null,

      metaTitle: row.meta_title || null,
      metaDescription: row.meta_description || null,
      metaKeywords: row.meta_keywords || null,

      popularity: Number(row.popularity) || 0,
      position: Number(row.position) || 0,

      createdBy: auth.user?.id ?? null,
    })
  } catch (err: any) {
    errors.push({
      row,
      message: err.message,
    })
  }
})
        .on('end', async () => {
          try {
            if (products.length > 0) {
              await Product.createMany(products)
            }

            fs.unlinkSync(filePath)

            resolve(
              response.ok({
                message: 'Import CSV selesai',
                total_row: products.length + errors.length,
                success: products.length,
                failed: errors.length,
                errors,
              })
            )
          } catch (err: any) {
            reject(
              response.internalServerError({
                message: 'Gagal menyimpan data',
                error: err.message,
              })
            )
          }
        })
        .on('error', (err: any) => {
          reject(
            response.internalServerError({
              message: 'Gagal membaca file CSV',
              error: err.message,
            })
          )
        })
    })
  }
}
