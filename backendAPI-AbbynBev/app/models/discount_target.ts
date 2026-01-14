import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Discount from '#models/discount'

export default class DiscountTarget extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare discountId: number

  @column()
  declare targetType: number // 1 category_type, 2 product_variant

  @column()
  declare targetId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Discount, { foreignKey: 'discountId' })
  declare discount: BelongsTo<typeof Discount>
}
