import { ProductRepository, type ProductQuery } from './product_repository.js'
import fs from 'fs'
import csv from 'csv-parser'
import slugify from 'slugify'

export class ProductService {
  constructor(private repo = new ProductRepository()) {}

  /* =====================
   * EXISTING FUNCTIONS
   * ===================== */

  query(): ProductQuery {
    return this.repo.query()
  }

  find(id: number) {
    return this.repo.find(id)
  }

  findOrFail(id: number) {
    return this.repo.findOrFail(id)
  }

  paginate(q: ProductQuery, page: number, perPage: number) {
    return this.repo.paginate(q, page, perPage)
  }

  /* =====================
   * CSV IMPORT FUNCTIONS
   * ===================== */

  /**
   * 1️⃣ Baca & parse CSV
   */
  async readCsv(filePath: string): Promise<any[]> {
    const rows: any[] = []

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row)
        })
        .on('end', () => {
          resolve(rows)
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }

  /**
   * 2️⃣ Mapping CSV → DB fields
   */
  mapCsvToProducts(rows: any[]) {
    const products: any[] = []
    const errors: any[] = []

    for (const row of rows) {
      try {
        // validasi minimal (sesuai fokus)
        if (!row.name || !row.category_type_id) {
          throw new Error('name / category_type_id wajib diisi')
        }

        products.push({
          name: row.name.trim(),

          // slug AMAN (tanpa error TS)
          slug:
            row.slug && row.slug !== ''
              ? row.slug
              : slugify.default(row.name, {
                  lower: true,
                  strict: true,
                }),

          description: row.description ?? null,
          basePrice: row.base_price ? Number(row.base_price) : null,
          weight: row.weight ? Number(row.weight) : 0,

          isFlashsale: Number(row.is_flash_sale) === 1,
          status: row.status ?? 'draft',

          categoryTypeId: Number(row.category_type_id),

          metaTitle: row.meta_title ?? null,
          metaDescription: row.meta_description ?? null,
          metaKeywords: row.meta_keywords ?? null,

          popularity: row.popularity ? Number(row.popularity) : null,
          position: row.position ? Number(row.position) : null,
          path: row.path ?? null,
        })
      } catch (err: any) {
        errors.push({
          row,
          message: err.message,
        })
      }
    }

    return { products, errors }
  }

  /**
   * 3️⃣ Full flow import CSV
   */
  async importFromCsv(filePath: string) {
    const rows = await this.readCsv(filePath)
    const { products, errors } = this.mapCsvToProducts(rows)

    if (products.length > 0) {
      await this.repo.createMany(products)
    }

    return {
      total: rows.length,
      success: products.length,
      failed: errors.length,
      errors,
    }
  }
}
