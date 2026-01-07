import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import Product from './product.js'
import ProductMedia from './product_media.js'
import AttributeValue from './attribute_value.js'

export default class ProductVariant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare sku: string

  @column()
  declare price: number

  @column()
  declare stock: number

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  // ✅ media nempel ke variant_id di product_medias
  @hasMany(() => ProductMedia, { foreignKey: 'variantId' })
  declare medias: HasMany<typeof ProductMedia>

  // ✅ attributes nempel via pivot table: variant_attributes
  @manyToMany(() => AttributeValue, {
    pivotTable: 'variant_attributes',
    pivotForeignKey: 'product_variant_id',
    pivotRelatedForeignKey: 'attribute_value_id',

    // pivot table kamu punya deleted_at, created_at, updated_at
    pivotColumns: ['deleted_at'],
    pivotTimestamps: true,
  })
  declare attributes: ManyToMany<typeof AttributeValue>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}