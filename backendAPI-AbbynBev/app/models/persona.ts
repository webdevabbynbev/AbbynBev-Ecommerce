import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class Persona extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }

  public static active = scope((query) => {
    return query.whereNull('deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })
}
