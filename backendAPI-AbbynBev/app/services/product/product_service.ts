import { ProductRepository, type ProductQuery } from './product_repository.js'

export class ProductService {
  constructor(private repo = new ProductRepository()) {}

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
}
