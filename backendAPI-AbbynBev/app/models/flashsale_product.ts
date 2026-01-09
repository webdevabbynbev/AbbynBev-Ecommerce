import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FlashSale from '#models/flashsale'
import Product from '#models/product'

export default class FlashSaleProduct extends BaseModel {
  public static table = 'flashsale_products'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'flash_sale_id' })
  declare flashSaleId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'flash_price' })
  declare flashPrice: number

  @column()
  declare stock: number

  @belongsTo(() => FlashSale)
  declare flashSale: BelongsTo<typeof FlashSale>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
