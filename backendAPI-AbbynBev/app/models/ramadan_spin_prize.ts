import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RamadanSpinPrize extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare weight: number

  @column({ columnName: 'is_grand' })
  declare isGrand: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean
  @column({ columnName: 'daily_quota' })
  declare dailyQuota: number | null

  @column({ columnName: 'voucher_id' })
  declare voucherId: number | null

  @column({ columnName: 'voucher_qty' })
  declare voucherQty: number

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
