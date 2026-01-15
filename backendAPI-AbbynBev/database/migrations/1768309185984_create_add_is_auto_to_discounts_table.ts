import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddIsAutoToDiscounts extends BaseSchema {
  public async up() {
    const has = await this.schema.hasColumn('discounts', 'is_auto')
    if (!has) {
      this.schema.alterTable('discounts', (table) => {
        table.tinyint('is_auto').notNullable().defaultTo(0)
        table.index(['is_auto'])
      })
    }
  }

  public async down() {
    const has = await this.schema.hasColumn('discounts', 'is_auto')
    if (has) {
      this.schema.alterTable('discounts', (table) => {
        table.dropIndex(['is_auto'])
        table.dropColumn('is_auto')
      })
    }
  }
}
