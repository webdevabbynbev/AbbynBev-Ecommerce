import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import ProductVariant from './product_variant.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class StockMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productVariantId: number

  @column()
  declare change: number

  @column()
  declare type: string

  @column()
  declare relatedId: number | null

  @column()
  declare note: string | null

  @belongsTo(() => ProductVariant)
  declare variant: BelongsTo<typeof ProductVariant>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
