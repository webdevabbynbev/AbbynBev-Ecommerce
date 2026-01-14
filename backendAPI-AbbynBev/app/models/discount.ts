import { DateTime } from 'luxon'
import { BaseModel, column, scope } from '@adonisjs/lucid/orm'

export default class Discount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column({ columnName: 'value_type' })
  declare valueType: number

  @column()
  declare value: number

  @column({ columnName: 'max_discount' })
  declare maxDiscount: number | null

  @column({ columnName: 'applies_to' })
  declare appliesTo: number

  @column({ columnName: 'min_order_amount' })
  declare minOrderAmount: number | null

  @column({ columnName: 'min_order_qty' })
  declare minOrderQty: number | null

  @column({ columnName: 'eligibility_type' })
  declare eligibilityType: number | null

  @column({ columnName: 'usage_limit' })
  declare usageLimit: number | null

  // ======================
  // SCHEDULE (buat service)
  // ======================
  @column.dateTime({ columnName: 'start_date' })
  declare startDate: DateTime | null

  @column.dateTime({ columnName: 'end_date' })
  declare endDate: DateTime | null

  /**
   * Bitmask hari (1<<weekday). Kalau kolom ini belum ada di DB, biarin aja null.
   * Service akan fallback ke 127 (everyday).
   */
  @column({ columnName: 'days_of_week_mask' })
  declare daysOfWeekMask: number | null

  @column({ columnName: 'usage_count' })
  declare usageCount: number | null

  @column({ columnName: 'reserved_count' })
  declare reservedCount: number | null

  // ======================
  // STATUS / SOFT DELETE
  // ======================
  @column({
    columnName: 'is_active',
    consume: (v) => Boolean(Number(v)),
    prepare: (v) => (v ? 1 : 0),
  })
  declare isActive: boolean

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // ======================
  // ALIAS biar cocok sama DiscountPricingService
  // ======================
  public get startedAt() {
    return this.startDate
  }

  public get expiredAt() {
    return this.endDate
  }

  // ======================
  // SCOPES
  // ======================
  public static active = scope((q) => q.whereNull('discounts.deleted_at'))
}
