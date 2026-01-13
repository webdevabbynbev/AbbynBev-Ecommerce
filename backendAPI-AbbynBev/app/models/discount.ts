import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import DiscountTarget from '#models/discount_target'
import DiscountRedemption from '#models/discount_redemption'

export default class Discount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column()
  declare valueType: number // 1 percentage, 2 nominal

  @column()
  declare value: string // decimal biasanya kebaca string (aman)

  @column()
  declare maxDiscount: string | null

  @column()
  declare appliesTo: number // 0 all, 1 min_order, 2 collection, 3 variant

  @column()
  declare minOrderAmount: string | null

  @column()
  declare minOrderQty: number | null

  @column()
  declare eligibilityType: number // 0 all, 1 users, 2 groups

  @column()
  declare usageLimit: number | null

  @column()
  declare usageCount: number

  @column()
  declare reservedCount: number

  @column()
  declare isActive: number

  @column()
  declare isEcommerce: number

  @column()
  declare isPos: number

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare expiredAt: DateTime | null

  @column()
  declare daysOfWeekMask: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => DiscountTarget, { foreignKey: 'discountId' })
  declare targets: HasMany<typeof DiscountTarget>

  @hasMany(() => DiscountRedemption, { foreignKey: 'discountId' })
  declare redemptions: HasMany<typeof DiscountRedemption>

  public static active = scope((query) => query.whereNull('deleted_at'))
  public static trashed = scope((query) => query.whereNotNull('deleted_at'))

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }
}
