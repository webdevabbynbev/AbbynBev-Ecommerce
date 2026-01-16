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

  // 1 = percentage, 2 = nominal
  @column({ columnName: 'value_type' })
  declare valueType: number

  /**
   * DB: decimal(12,2)
   * Adonis MySQL sering balikin string untuk decimal, jadi kita cast ke number biar konsisten.
   */
  @column({
    columnName: 'value',
    consume: (v) => (v === null || v === undefined ? 0 : Number(v)),
    prepare: (v) => (v === null || v === undefined ? 0 : Number(v)),
  })
  declare value: number

  @column({
    columnName: 'max_discount',
    consume: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
    prepare: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
  })
  declare maxDiscount: number | null

  // 0 all, 1 min_order, 2 collection, 3 variant
  @column({ columnName: 'applies_to' })
  declare appliesTo: number

  @column({
    columnName: 'min_order_amount',
    consume: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
    prepare: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
  })
  declare minOrderAmount: number | null

  @column({ columnName: 'min_order_qty' })
  declare minOrderQty: number | null

  // 0 all, 1 specific_customers
  @column({ columnName: 'eligibility_type' })
  declare eligibilityType: number

  @column({ columnName: 'usage_limit' })
  declare usageLimit: number | null

  @column({ columnName: 'usage_count' })
  declare usageCount: number

  @column({ columnName: 'reserved_count' })
  declare reservedCount: number

  // DB: tinyint 1/0
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

  // DB: int unsigned, default 127 (semua hari)
  @column({
    columnName: 'days_of_week_mask',
    consume: (v) => (v === null || v === undefined ? 127 : Number(v)),
    prepare: (v) => (v === null || v === undefined ? 127 : Number(v)),
  })
  declare daysOfWeekMask: number

  @column({
    columnName: 'is_auto',
    consume: (v) => Number(v) === 1,
    prepare: (v) => (v ? 1 : 0),
  })
  declare isAuto: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  // hanya ambil yang belum soft-delete
  public static active = scope((q) => q.whereNull('discounts.deleted_at'))
}
