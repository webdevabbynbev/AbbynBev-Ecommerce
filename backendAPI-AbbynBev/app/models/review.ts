import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import User from './user.js'

export default class Review extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare productId: number

  @column()
  declare rating: number

  @column()
  declare comment: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => (value ? JSON.parse(value) : []),
  })
  declare images: string[]

  @column()
  declare isVerifiedPurchase: boolean

  @column()
  declare likes: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  public async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }
}
