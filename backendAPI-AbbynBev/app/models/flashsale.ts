import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Product from '#models/product'

export default class FlashSale extends BaseModel {
  public static table = 'flash_sales'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string | null

  @column()
  declare description: string | null

  @column({ columnName: 'has_button' })
  declare hasButton: boolean

  @column({ columnName: 'button_text' })
  declare buttonText: string | null

  @column({ columnName: 'button_url' })
  declare buttonUrl: string | null

  @column.dateTime({ columnName: 'start_datetime' })
  declare startDatetime: DateTime

  @column.dateTime({ columnName: 'end_datetime' })
  declare endDatetime: DateTime

  @column({ columnName: 'is_publish' })
  declare isPublish: boolean

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'updated_by' })
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  @manyToMany(() => Product, {
    pivotTable: 'flashsale_products',
    localKey: 'id',
    pivotForeignKey: 'flash_sale_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'product_id',
    pivotColumns: ['flash_price', 'stock'],
  })
  declare products: ManyToMany<typeof Product>
}
