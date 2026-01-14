import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import Product from './product.js'
import ProductMedia from './product_media.js'
import AttributeValue from './attribute_value.js'

export default class ProductVariant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sku: string

  @column()
  declare barcode: string

  // DB kamu price = string (sesuai yang sebelumnya)
  @column()
  declare price: string

  @column()
  declare stock: number

  @column({ columnName: 'product_id' })
  declare productId: number | null

  @column()
  declare width: number | null

  @column()
  declare height: number | null

  @column()
  declare length: number | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare product: BelongsTo<typeof Product>

  // jalan kalau product_medias punya kolom variant_id
  @hasMany(() => ProductMedia, { foreignKey: 'variantId' })
  declare medias: HasMany<typeof ProductMedia>


  @hasMany(() => AttributeValue, { foreignKey: 'productVariantId' })
  declare attributes: HasMany<typeof AttributeValue>

  public static active = scope((query) => {
    query.whereNull('product_variants.deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('product_variants.deleted_at')
  })
}
