import { ProductRepository, type ProductQuery } from './product_repository.js'
import fs from 'fs'
import csv from 'csv-parser'

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
   * CSV IMPORT FUNCTION
   * ===================== */

  async importFromCsv(filePath: string) {
    const rows: any[] = []

    return new Promise<any[]>( (resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row)
        })
        .on('end', async () => {
          try {

            resolve(rows)
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }
}
