import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Product from './product.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ProductVariant from './product_variant.js'
import Transaction from './transaction.js'

export default class TransactionDetail extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare qty: number

  @column()
  declare price: number

  @column()
  declare amount: string

  @column()
  declare discount: number

  @column()
  declare productId: number

  @column()
  declare productVariantId: number

  @column()
  declare transactionId: number

  @column()
  declare attributes: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction)
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => ProductVariant, {
    foreignKey: 'productVariantId',
  })
  declare variant: BelongsTo<typeof ProductVariant>
}
