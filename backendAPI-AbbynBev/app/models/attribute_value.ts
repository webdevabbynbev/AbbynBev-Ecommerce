import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Attribute from './attribute.js'
import ProductVariant from './product_variant.js'


export default class AttributeValue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare value: string

  @column()
  declare attributeId: number

  // ✅ TAMBAH INI (map ke attribute_values.variant_id)
  @column()
  declare variantId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => Attribute, { foreignKey: 'attributeId' })
  declare attribute: BelongsTo<typeof Attribute>

  @manyToMany(() => ProductVariant, {
  pivotTable: 'variant_attributes',
  pivotForeignKey: 'attribute_value_id',
  pivotRelatedForeignKey: 'product_variant_id',
})
declare variants: ManyToMany<typeof ProductVariant>

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
}