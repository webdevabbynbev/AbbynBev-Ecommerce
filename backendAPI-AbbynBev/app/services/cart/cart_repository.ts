// app/services/cart/cart_repository.ts
import TransactionCart from '#models/transaction_cart'

type SortDir = 'asc' | 'desc'

type CartListOptions = {
  sortBy?: string
  sortType?: string
  isCheckout?: any
  page?: number
  perPage?: number
}

export class CartRepository {
  private sanitizeSort(sortBy?: string, sortType?: string): { field: string; dir: SortDir } {
    const allowedFields = new Set(['created_at', 'id', 'qty', 'amount', 'price'])
    const field = allowedFields.has(String(sortBy)) ? String(sortBy) : 'created_at'

    const dirRaw = String(sortType || 'DESC').toUpperCase()
    const dir: SortDir = dirRaw === 'ASC' ? 'asc' : 'desc'

    return { field, dir }
  }

  getTotalRaw(userId: number) {
    return TransactionCart.query().where('user_id', userId).where('is_checkout', '!=', 2)
  }

  paginateForUser(userId: number, opts: CartListOptions) {
    const { field, dir } = this.sanitizeSort(opts.sortBy, opts.sortType)
    const page = Number.isFinite(opts.page as any) ? Number(opts.page) : 1
    const perPage = Number.isFinite(opts.perPage as any) ? Number(opts.perPage) : 10
    const isCheckout = opts.isCheckout ?? ''

    return TransactionCart.query()
      .where('transaction_carts.user_id', userId)
      .where('transaction_carts.is_checkout', '!=', 2)
      .if(isCheckout !== '', (query) => {
        query.where('transaction_carts.is_checkout', isCheckout)
      })
      .preload('product', (query) => {
        query.preload('medias').preload('brand').preload('categoryType')
      })
      .preload('variant', (variantLoader) => {
        variantLoader.preload('attributes', (attributeLoader) => {
          attributeLoader.preload('attribute')
        })
      })
      .orderBy(`transaction_carts.${field}`, dir) // ✅ sekarang dir sudah 'asc' | 'desc'
      .paginate(page, perPage)
  }

  miniForUser(userId: number, limit = 10) {
    return TransactionCart.query()
      .where('user_id', userId)
      .where('is_checkout', '!=', 2)
      .preload('product', (q) => q.preload('medias'))
      .preload('variant')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  findExisting(trx: any, userId: number, productId: number, variantId: number) {
    return TransactionCart.query({ client: trx })
      .where('user_id', userId)
      .where('product_id', productId)
      .where('product_variant_id', variantId)
      .where('is_checkout', '!=', 2)
      .first()
  }

  findByIdForUser(trx: any, userId: number, cartId: number) {
    return TransactionCart.query({ client: trx })
      .where('id', cartId)
      .where('user_id', userId)
      .preload('variant')
      .first()
  }

  findByIdOnly(trx: any, userId: number, cartId: number) {
    return TransactionCart.query({ client: trx }).where('id', cartId).where('user_id', userId).first()
  }
}
