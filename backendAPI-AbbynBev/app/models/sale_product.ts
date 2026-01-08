import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Sale from '#models/sale'
import Product from '#models/product'

export default class SaleProduct extends BaseModel {
  public static table = 'sale_products'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sale_id' })
  declare saleId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'sale_price' })
  declare salePrice: number

  @column()
  declare stock: number

  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}