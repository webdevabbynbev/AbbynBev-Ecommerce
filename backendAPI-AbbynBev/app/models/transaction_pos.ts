import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from '#models/transaction'
import User from '#models/user'

export default class TransactionPos extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare cashierId: number | null

  @column()
  declare paymentMethod: string

  @column()
  declare receivedAmount: number

  @column()
  declare changeAmount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction)
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'cashierId' })
  declare cashier: BelongsTo<typeof User>
}
