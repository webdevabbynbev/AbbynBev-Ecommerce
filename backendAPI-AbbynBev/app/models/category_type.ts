import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CategoryType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare parentId: number | null

  @column({ columnName: 'icon_public_id' })
  declare iconPublicId: string | null

  @column()
  declare level: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  @hasMany(() => CategoryType, {
    foreignKey: 'parentId',
  })
  declare children: HasMany<typeof CategoryType>

  @belongsTo(() => CategoryType, {
    foreignKey: 'parentId',
  })
  declare parent: BelongsTo<typeof CategoryType>

  public static active = scope((query) => {
    query.whereNull('deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }

  public static async findColumnWithSoftDelete(column: string, value: any) {
    return this.query().where(column, value).first()
  }
}
