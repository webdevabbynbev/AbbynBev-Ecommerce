import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

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
  declare barcode: string

  @column({
    consume: (v) => Number(v),
    prepare: (v) => String(v),
  })
  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

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

    public async adjustStock(
    change: number,
    type: string,
    relatedId?: number,
    note?: string,
    trx?: TransactionClientContract
  ) {
    const delta = Number(change)
    if (!Number.isFinite(delta)) throw new Error('Invalid stock change')

    const nextStock = Number(this.stock || 0) + delta
    if (nextStock < 0) throw new Error('Insufficient stock')

    if (trx) this.useTransaction(trx)

    this.stock = nextStock
    await this.save()

    const client: any = trx ?? db
    await client.table('stock_movements').insert({
      product_variant_id: this.id,
      change: delta,
      type,
      related_id: relatedId ?? null,
      note: note ?? null,
    })

    return this
  }

  @column()
declare width: number | null

@column()
declare height: number | null

@column()
declare length: number | null

@column()
declare weight: number | null


}

