import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import User from '#models/user'
import TransactionEcommerce from '#models/transaction_ecommerce'
import Province from '#models/province'
import City from '#models/city'
import District from '#models/district'
import SubDistrict from '#models/sub_district'

export default class UserAddress extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare address: string | null

  @column({ columnName: 'pic_name' })
  declare picName: string | null

  @column({ columnName: 'pic_phone' })
  declare picPhone: string | null

  @column({ columnName: 'pic_label' })
  declare picLabel: string | null

  @column({ columnName: 'is_active' })
  declare isActive: number

  // Lama (boleh null karena sekarang pakai Biteship)
  @column()
  declare city: number | null

  @column()
  declare province: number | null

  @column()
  declare district: number | null

  @column({ columnName: 'sub_district' })
  declare subDistrict: number | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string | null

  @column()
  declare benchmark: string | null

  // ✅ Biteship fields
  @column({ columnName: 'biteship_area_id' })
  declare biteshipAreaId: string | null

  @column({ columnName: 'biteship_area_name' })
  declare biteshipAreaName: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => TransactionEcommerce, { foreignKey: 'userAddressesId' })
  declare transactions: HasMany<typeof TransactionEcommerce>

  @belongsTo(() => Province, { foreignKey: 'province' })
  declare provinceData: BelongsTo<typeof Province>

  @belongsTo(() => City, { foreignKey: 'city' })
  declare cityData: BelongsTo<typeof City>

  @belongsTo(() => District, { foreignKey: 'district' })
  declare districtData: BelongsTo<typeof District>

  @belongsTo(() => SubDistrict, { foreignKey: 'subDistrict' })
  declare subDistrictData: BelongsTo<typeof SubDistrict>
}
