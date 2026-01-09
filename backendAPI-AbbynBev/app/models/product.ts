import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import CategoryType from './category_type.js'
import ProductVariant from './product_variant.js'
import ProductDiscount from './product_discount.js'
import ProductMedia from './product_media.js'
import Review from './review.js'
import Tag from './tag.js'
import Brand from './brand.js'
import Persona from './persona.js'
import FlashSale from './flashsale.js'
import ConcernOption from './concern_option.js'
import ProfileCategoryOption from './profile_category_option.js'


export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare basePrice: number | null

  @column()
  declare weight: number

  @column({ columnName: 'is_flash_sale', consume: (v) => Boolean(v) })
  declare isFlashSale: boolean

@column({
    columnName: 'is_flash_sale',
    consume: (v) => Boolean(Number(v)),
    prepare: (v) => (v ? 1 : 0),
  })
  
  @column()
  declare status: 'normal' | 'war' | 'draft'

  @column()
  declare categoryTypeId: number

  @column()
  declare brandId: number

  @column()
  declare personaId: number

  @belongsTo(() => CategoryType)
  declare categoryType: BelongsTo<typeof CategoryType>

  @belongsTo(() => Brand)
  declare brand: BelongsTo<typeof Brand>

  @belongsTo(() => Persona)
  declare persona: BelongsTo<typeof Persona>

  @column()
  declare metaTitle: string | null

  @column()
  declare metaDescription: string | null

  @column()
  declare metaKeywords: string | null

  @column()
  declare position: number | null

  @column()
  declare popularity: number

  @column()
  declare path: string | null

  @column()
  declare masterSku: string | null

  @hasMany(() => ProductVariant)
  declare variants: HasMany<typeof ProductVariant>

  @hasMany(() => ProductMedia)
  declare medias: HasMany<typeof ProductMedia>

  @hasMany(() => ProductDiscount)
  declare discounts: HasMany<typeof ProductDiscount>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  @manyToMany(() => Tag, {
    pivotTable: 'product_tags',
    pivotColumns: ['start_date', 'end_date'],
  })
  declare tags: ManyToMany<typeof Tag>

  @hasMany(() => FlashSale)
  declare flashSales: HasMany<typeof FlashSale>

  @manyToMany(() => ConcernOption, {
    pivotTable: 'product_concerns',
  })
  declare concernOptions: ManyToMany<typeof ConcernOption>

  @manyToMany(() => ProfileCategoryOption, {
    pivotTable: 'product_category_profiles',
    pivotForeignKey: 'product_id',
    pivotRelatedForeignKey: 'profile_category_options_id',
  })
  declare profileOptions: ManyToMany<typeof ProfileCategoryOption>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  public static active = scope((query) => {
    query.whereNull('products.deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })

  public static visible = scope((query) => {
    query
      .whereNull('deleted_at')
      .whereIn('status', ['normal', 'war'])
      .whereHas('variants' as any, (variantQuery) => {
        variantQuery.where('stock', '>', 0)
      })
  })

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }
}
