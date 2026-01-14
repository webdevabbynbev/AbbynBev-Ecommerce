import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  manyToMany,
  scope,
} from '@adonisjs/lucid/orm'
import type {
  BelongsTo,
  ManyToMany,
} from '@adonisjs/lucid/types/relations'

import Attribute from './attribute.js'
import ProductVariant from './product_variant.js'

export default class AttributeValue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare value: string

  @column({ columnName: 'attribute_id' })
  declare attributeId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  // =========================
  // RELATIONS
  // =========================

  @belongsTo(() => Attribute, { foreignKey: 'attributeId' })
  declare attribute: BelongsTo<typeof Attribute>

  /**
   * attribute_values ↔ product_variants
   * via pivot product_variant_attributes
   */
  @manyToMany(() => ProductVariant, {
    pivotTable: 'product_variant_attributes',
    pivotForeignKey: 'attribute_value_id',
    pivotRelatedForeignKey: 'product_variant_id',
    pivotTimestamps: true,
  })
  declare productVariants: ManyToMany<typeof ProductVariant>

  // =========================
  // SCOPES
  // =========================

  public static active = scope((query) => {
    query.whereNull('deleted_at')
  })

  public static trashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })

  // =========================
  // HELPERS
  // =========================

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  public async restore() {
    this.deletedAt = null
    await this.save()
  }
}
