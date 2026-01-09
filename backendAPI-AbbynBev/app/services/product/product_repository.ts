import Product from '#models/product'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export type ProductQuery = ModelQueryBuilderContract<typeof Product>

export class ProductRepository {
  query(): ProductQuery {
    return Product.query()
  }

  find(id: number) {
    return Product.find(id)
  }

  findOrFail(id: number) {
    return Product.findOrFail(id)
  }

  paginate(q: ProductQuery, page: number, perPage: number) {
    return q.paginate(page, perPage)
  }

  /* =====================
   * CSV IMPORT SUPPORT
   * ===================== */
  async createMany(data: Partial<Product>[]) {
    return Product.createMany(data)
  }
}
