import type { HttpContext } from '@adonisjs/core/http'
import csv from 'csv-parser'
import fs from 'fs'
import Product from '#models/product'

export default class ProductCsvImportController {
  async import({ request, response }: HttpContext) {
    const file = request.file('file', {
      extnames: ['csv'],
    })

    if (!file) {
      return response.badRequest({ message: 'File CSV tidak ditemukan' })
    }

    const filePath = file.tmpPath!
    const products: any[] = []

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          products.push({
            name: row.name,
            price: Number(row.price),
            stock: Number(row.stock),
            sku: row.sku,
          })
        })
        .on('end', async () => {
          try {
            await Product.createMany(products)
            fs.unlinkSync(filePath)

            resolve(
              response.ok({
                message: 'Import CSV berhasil',
                total: products.length,
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
        .on('error', (err: any) => reject(err))
    })
  }
}
