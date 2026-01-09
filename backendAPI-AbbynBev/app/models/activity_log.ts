import { DateTime } from 'luxon'
import { BaseModel, column, computed } from '@adonisjs/lucid/orm'

export default class ActivityLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roleName: string

  @column()
  declare userName: string

  @column()
  declare activity: string

  @column()
  declare menu: string

  @column()
  declare data: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed({ serializeAs: 'data_array' })
  public get data_array(): any {
    return JSON.parse(this.data)
  }
}
