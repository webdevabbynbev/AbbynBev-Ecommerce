import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Voucher from '#models/voucher'
import User from '#models/user'
import Transaction from '#models/transaction'

export enum VoucherClaimStatus {
  CLAIMED = 0,
  RESERVED = 1,
  USED = 2,
}

export default class VoucherClaim extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'voucher_id' })
  declare voucherId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare status: number

  @column({ columnName: 'transaction_id' })
  declare transactionId: number | null

  @column.dateTime({ columnName: 'claimed_at' })
  declare claimedAt: DateTime

  @column.dateTime({ columnName: 'reserved_at' })
  declare reservedAt: DateTime | null

  @column.dateTime({ columnName: 'used_at' })
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Voucher, { foreignKey: 'voucherId' })
  declare voucher: BelongsTo<typeof Voucher>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>
}
