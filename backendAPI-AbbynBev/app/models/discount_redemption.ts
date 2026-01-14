import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Discount from '#models/discount'

export default class DiscountRedemption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare discountId: number

  @column()
  declare transactionId: number

  @column()
  declare userId: number | null

  @column()
  declare discountCode: string

  @column()
  declare status: number // 0 reserved, 1 used, 2 cancelled

  @column.dateTime()
  declare reservedAt: DateTime | null

  @column.dateTime()
  declare usedAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Discount, { foreignKey: 'discountId' })
  declare discount: BelongsTo<typeof Discount>
}
