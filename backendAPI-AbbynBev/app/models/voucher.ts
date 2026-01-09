import { DateTime } from 'luxon'
import { BaseModel, column, scope, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import TransactionEcommerce from '#models/transaction_ecommerce'

export default class Voucher extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare price: string

  @column()
  declare maxDiscPrice: string

  @column()
  declare percentage: number

  @column()
  declare isPercentage: number

  @column()
  declare isActive: number

  @column()
  declare type: number

  @column()
  declare qty: number

  @column.dateTime()
  declare expiredAt: DateTime | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => TransactionEcommerce, {
    foreignKey: 'voucherId',
  })
  declare transactions: HasMany<typeof TransactionEcommerce>

  public static active = scope((query) => {
    query.whereNull('deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }
}
