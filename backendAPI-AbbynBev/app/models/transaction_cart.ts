import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import ProductVariant from './product_variant.js'
import User from './user.js'

export default class TransactionCart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare qty: number

  @column()
  declare price: number

  @column()
  declare amount: number

  @column()
  declare discount: number

  @column()
  declare isCheckout: number

  @column()
  declare qtyCheckout: number

  @column()
  declare attributes: string | null

  @column()
  declare productVariantId: number | null

  @column()
  declare productId: number | null

  @column()
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => ProductVariant, {
    foreignKey: 'productVariantId',
  })
  declare variant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
