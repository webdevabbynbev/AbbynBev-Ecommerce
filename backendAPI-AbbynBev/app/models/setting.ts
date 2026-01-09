import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import { CustomBaseModel } from '#services/custom_base_model'

export default class Setting extends CustomBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare value: string

  @column()
  declare group: string

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
