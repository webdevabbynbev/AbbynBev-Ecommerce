import User from '#models/user'

export class DashboardCartsService {
  async getUserCarts(qs: any) {
    const page = Number(qs.page || 1)
    const perPage = Number(qs.per_page || 10)
    const search = String(qs.q || '')

    const userCart = await User.query()
      .select(['users.id', 'users.first_name', 'users.last_name', 'users.email'])
      .has('carts')
      .if(search, (query) =>
        query
          .whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
          .orWhereHas('carts', (queryCart) =>
            queryCart.whereHas('product', (queryProduct) =>
              queryProduct.whereILike('products.name', `%${search}%`)
            )
          )
      )
      .preload('carts', (query) =>
        query
          .preload('product', (queryProduct) => queryProduct.preload('categoryType').preload('medias'))
          .preload('variant')
      )
      .paginate(page, perPage)

    const json = userCart.toJSON()
    return {
      data: json.data,
      ...json.meta,
    }
  }
}
