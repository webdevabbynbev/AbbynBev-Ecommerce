import ProductDiscountModel from '#models/product_discount'

export class CartPricingService {
 
  calculatePrice({
    type,
    price,
    value,
    maxValue,
  }: {
    type: number
    price: number
    value: number
    maxValue: number
  }) {
    if (type === 1) {
      const disc = price * (value / 100)
      if (disc > maxValue) return { price: price - maxValue, disc: maxValue }
      return { price: price - disc, disc }
    }
    return { price: price - value, disc: value }
  }


  async getDiscountPerUnit(trx: any, productId: number, variantPrice: number): Promise<number> {
    const now = new Date()
    now.setHours(now.getHours() + 7)
    const dateString = now.toISOString().slice(0, 19).replace('T', ' ')

    const discRow = await ProductDiscountModel.query({ client: trx })
      .where('product_id', productId)
      .where('start_date', '<=', dateString)
      .where('end_date', '>=', dateString)
      .first()

    if (!discRow) return 0

    const calc = this.calculatePrice({
      type: Number(discRow.type),
      price: Number(variantPrice),
      value: Number(discRow.value),
      maxValue: Number(discRow.maxValue),
    })

    return Number(calc.disc) || 0
  }
}
