import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import { CustomBaseModel } from '#services/custom_base_model'

export default class Faq extends CustomBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare question: string

  @column()
  declare answer: string

  @column({ serializeAs: 'is_published' })
  declare is_published: number

  @column()
  declare createdBy: number

  @column()
  declare updatedBy: number

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
