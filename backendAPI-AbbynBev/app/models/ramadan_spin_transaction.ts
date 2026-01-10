import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import RamadanSpinPrize from '#models/ramadan_spin_prize'

export default class RamadanSpinTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'prize_id' })
  declare prizeId: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => RamadanSpinPrize, {
    foreignKey: 'prizeId',
  })
  declare prize: BelongsTo<typeof RamadanSpinPrize>
}
