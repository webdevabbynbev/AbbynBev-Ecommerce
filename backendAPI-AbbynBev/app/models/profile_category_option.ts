import { BaseModel, column, belongsTo, hasMany, manyToMany, scope } from '@adonisjs/lucid/orm'
import type { ManyToMany, BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProfileCategory from '#models/profile_category'
import UserBeautyProfileOption from '#models/user_beauty_profile_option'
import Product from './product.js'

export default class ProfileCategoryOption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'profile_categories_id' })
  declare profileCategoriesId: number

  @column()
  declare label: string

  @column()
  declare value: string

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ProfileCategory, {
    foreignKey: 'profileCategoriesId',
  })
  declare category: BelongsTo<typeof ProfileCategory>

  @hasMany(() => UserBeautyProfileOption, {
    foreignKey: 'profileCategoryOptionsId',
  })
  declare userOptions: HasMany<typeof UserBeautyProfileOption>

  @manyToMany(() => Product, {
    pivotTable: 'product_category_profiles',
    pivotForeignKey: 'profile_category_options_id',
    pivotRelatedForeignKey: 'product_id',
  })
  declare products: ManyToMany<typeof Product>

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
