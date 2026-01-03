import TransactionEcommerce from '#models/transaction_ecommerce'
import NumberUtils from '../../utils/number.js'

type SortDir = 'asc' | 'desc'

export class EcommerceRepository {
  private toSortDir(v: any): SortDir {
    const s = String(v || '').toLowerCase()
    return s === 'asc' ? 'asc' : 'desc'
  }

  private sanitizeSort(field: any) {
    const allowedSort = new Set(['created_at', 'updated_at', 'id', 'shipping_cost', 'user_address_id'])
    return allowedSort.has(String(field)) ? String(field) : 'created_at'
  }

  listForUser(userId: number, qs: any) {
    const page = NumberUtils.toNumber(qs.page, 1) || 1
    const perPage = NumberUtils.toNumber(qs.per_page, 10) || 10

    const sortBy = this.sanitizeSort(qs.field)
    const sortDir = this.toSortDir(qs.value)

    const transactionNumber = qs.transaction_number ?? ''
    const status = qs.status ?? ''
    const startDate = qs.start_date ?? ''
    const endDate = qs.end_date ?? ''

    return TransactionEcommerce.query()
      .whereHas('transaction', (trxQuery) => {
        trxQuery.where('user_id', userId)

        if (transactionNumber) trxQuery.where('transaction_number', transactionNumber)
        if (status) trxQuery.where('transaction_status', status)
        if (startDate) trxQuery.where('created_at', '>=', startDate)
        if (endDate) trxQuery.where('created_at', '<=', endDate)
      })
      .preload('transaction', (trxLoader) => {
        trxLoader.preload('details', (detailLoader) => {
          detailLoader.preload('product', (productLoader) => {
            productLoader.preload('medias')
          })
        })
      })
      .preload('shipments')
      .orderBy(sortBy, sortDir)
      .paginate(page, perPage)
  }

  findByTransactionNumber(transactionNumber: string) {
    return TransactionEcommerce.query()
      .whereHas('transaction', (trxQuery) => {
        trxQuery.where('transaction_number', transactionNumber)
      })
      .preload('transaction', (trxLoader) => {
        trxLoader
          .preload('details', (query) => {
            query.preload('product', (productLoader) => {
              productLoader.preload('medias').preload('categoryType')
            })
          })
          .preload('shipments')
      })
      .preload('shipments')
      .preload('userAddress')
      .preload('user')
      .first()
  }
}
