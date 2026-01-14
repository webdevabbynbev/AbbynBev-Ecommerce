import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Attribute from './attribute.js'
import ProductVariant from './product_variant.js'

export default class AttributeValue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare value: string

  @column({ columnName: 'attribute_id' })
  declare attributeId: number

  // ✅ Opsi B: nempel langsung ke 1 variant
  @column({ columnName: 'product_variant_id' })
  declare productVariantId: number | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  // =========================
  // RELATIONS
  // =========================
  @belongsTo(() => Attribute, { foreignKey: 'attributeId' })
  declare attribute: BelongsTo<typeof Attribute>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare productVariant: BelongsTo<typeof ProductVariant>

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
