import Transaction from '#models/transaction'

export class TransactionRepository {
  paginateCms(filters: any, pageNumber: number, perPage: number) {
    const {
      transaction_number,
      transaction_status,
      user,
      start_date,
      end_date,
      channel,
    } = filters

    return Transaction.query()
      .if(transaction_number, (query) => {
        query.where('transaction_number', transaction_number)
      })
      .if(transaction_status, (query) => {
        const raw = String(transaction_status || '')
        const arr = raw
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)

        if (arr.length > 1) query.whereIn('transaction_status', arr)
        else if (arr.length === 1) query.where('transaction_status', arr[0])
      })
      .if(user, (query) => {
        query.where('user_id', user)
      })
      .if(start_date, (query) => {
        query.where('created_at', '>=', start_date)
      })
      .if(end_date, (query) => {
        query.where('created_at', '<=', end_date)
      })
      .if(channel, (query) => {
        if (channel === 'ecommerce') query.whereHas('ecommerce', () => {})
        if (channel === 'pos') query.whereHas('pos', () => {})
      })
      .preload('details', (detailsQuery) => {
        detailsQuery.preload('product', (productLoader) => {
          productLoader.preload('medias')
        })
        detailsQuery.preload('variant')
      })
      .preload('user')
      .preload('shipments')
      .preload('ecommerce')
      .preload('pos')
      .orderBy('created_at', 'desc')
      .paginate(pageNumber, perPage)
  }

  findCmsById(id: number) {
    return Transaction.query()
      .where('id', id)
      .preload('details', (detail) => {
        detail.preload('product', (p) => p.preload('medias'))
        detail.preload('variant')
      })
      .preload('shipments')
      .preload('ecommerce', (ec) => {
        ec.preload('userAddress', (addr) => {
          addr.preload('provinceData')
          addr.preload('cityData')
          addr.preload('districtData')
          addr.preload('subDistrictData')
        })
        ec.preload('user')
      })
      .preload('user')
      .preload('pos')
      .first()
  }
}
