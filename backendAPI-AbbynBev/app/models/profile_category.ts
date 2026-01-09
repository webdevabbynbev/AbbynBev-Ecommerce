import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProfileCategoryOption from '#models/profile_category_option'

export default class ProfileCategory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: string | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ProfileCategoryOption, {
    foreignKey: 'profileCategoriesId',
  })
  declare options: HasMany<typeof ProfileCategoryOption>

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
