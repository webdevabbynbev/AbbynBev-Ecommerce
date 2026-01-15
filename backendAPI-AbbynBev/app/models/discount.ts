import { DateTime } from 'luxon'
import { BaseModel, column, scope } from '@adonisjs/lucid/orm'

export default class Discount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column({ columnName: 'value_type' })
  declare valueType: number

  @column()
  declare value: string

  @column({ columnName: 'max_discount' })
  declare maxDiscount: string | null

  @column({ columnName: 'applies_to' })
  declare appliesTo: number

  @column({ columnName: 'min_order_amount' })
  declare minOrderAmount: string | null

  @column({ columnName: 'min_order_qty' })
  declare minOrderQty: number | null

  @column({ columnName: 'eligibility_type' })
  declare eligibilityType: number

  @column({ columnName: 'usage_limit' })
  declare usageLimit: number | null

  @column({ columnName: 'usage_count' })
  declare usageCount: number

  @column({ columnName: 'reserved_count' })
  declare reservedCount: number

  // DB: 1/0
  @column({
    columnName: 'is_active',
    consume: (v) => Number(v) === 1,
    prepare: (v) => (v ? 1 : 0),
  })
  declare isActive: boolean

  @column({
    columnName: 'is_ecommerce',
    consume: (v) => Number(v) === 1,
    prepare: (v) => (v ? 1 : 0),
  })
  declare isEcommerce: boolean

  @column({
    columnName: 'is_pos',
    consume: (v) => Number(v) === 1,
    prepare: (v) => (v ? 1 : 0),
  })
  declare isPos: boolean

  @column.dateTime({ columnName: 'started_at' })
  declare startedAt: DateTime | null

  @column.dateTime({ columnName: 'expired_at' })
  declare expiredAt: DateTime | null

  @column({ columnName: 'days_of_week_mask' })
  declare daysOfWeekMask: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  public static active = scope((q) => q.whereNull('discounts.deleted_at'))
}
