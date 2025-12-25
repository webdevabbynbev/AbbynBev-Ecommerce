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

  /**
   * Total cart items (RAW query) untuk user.
   * NOTE: Jangan exclude is_checkout=2, karena item checkout tetap bagian dari cart.
   */
  getTotalRaw(userId: number) {
    return TransactionCart.query().where('user_id', userId)
  }

  /**
   * Paginate list cart.
   * - Kalau `isCheckout` dikirim (mis: 2), maka filter pakai itu.
   * - Kalau tidak dikirim, tampilkan semua cart.
   */
  paginateForUser(userId: number, opts: CartListOptions) {
    const { field, dir } = this.sanitizeSort(opts.sortBy, opts.sortType)
    const page = Number.isFinite(opts.page as any) ? Number(opts.page) : 1
    const perPage = Number.isFinite(opts.perPage as any) ? Number(opts.perPage) : 10
    const isCheckout = opts.isCheckout ?? ''

    const q = TransactionCart.query().where('transaction_carts.user_id', userId)

    // Apply filter hanya jika isCheckout benar-benar dikirim
    if (isCheckout !== '' && isCheckout !== null && typeof isCheckout !== 'undefined') {
      q.where('transaction_carts.is_checkout', isCheckout)
    }

    return q
      .preload('product', (query) => {
        query.preload('medias').preload('brand').preload('categoryType')
      })
      .preload('variant', (variantLoader) => {
        variantLoader.preload('attributes', (attributeLoader) => {
          attributeLoader.preload('attribute')
        })
      })
      .orderBy(`transaction_carts.${field}`, dir)
      .paginate(page, perPage)
  }

  /**
   * Mini cart list (header dropdown, dll)
   */
  miniForUser(userId: number, limit = 10) {
    return TransactionCart.query()
      .where('user_id', userId)
      .preload('product', (q) => q.preload('medias'))
      .preload('variant')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Cari item cart existing untuk merge qty.
   * Jangan exclude is_checkout=2, biar tidak bikin duplicate row.
   */
  findExisting(trx: any, userId: number, productId: number, variantId: number) {
    return TransactionCart.query({ client: trx })
      .where('user_id', userId)
      .where('product_id', productId)
      .where('product_variant_id', variantId)
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
