import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class RamadanSpinTicket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare tickets: number

  @column.dateTime({ autoCreate: true, columnName: 'earned_at' })
  declare earnedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
