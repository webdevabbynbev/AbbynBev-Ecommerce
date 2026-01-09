// app/models/transaction_shipment.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'

export default class TransactionShipment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare service: string | null

  @column({ columnName: 'service_type' })
  declare serviceType: string | null

  @column()
  declare price: number | null

  @column({ columnName: 'resi_number' })
  declare resiNumber: string | null

  @column()
  declare address: string | null

  @column()
  declare status: string | null

  @column({ columnName: 'province_id' })
  declare provinceId: number | null

  @column({ columnName: 'city_id' })
  declare cityId: number | null

  @column({ columnName: 'district_id' })
  declare districtId: number | null

  @column({ columnName: 'subdistrict_id' })
  declare subdistrictId: number | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string

  @column()
  declare pic: string | null

  @column({ columnName: 'pic_phone' })
  declare picPhone: string | null

  @column({ columnName: 'estimation_arrival' })
  declare estimationArrival: string | null

  // ✅ NEW: Delivery Date (proper)
  @column.dateTime({ columnName: 'delivered_at' })
  declare deliveredAt: DateTime | null

  @column({ columnName: 'is_protected' })
  declare isProtected: number

  @column({ columnName: 'protection_fee' })
  declare protectionFee: number

  @column({ columnName: 'transaction_id' })
  declare transactionId: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction)
  declare transaction: BelongsTo<typeof Transaction>
}
