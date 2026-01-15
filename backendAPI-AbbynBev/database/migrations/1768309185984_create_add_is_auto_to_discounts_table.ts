import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateAddIsAutoToDiscountsTable extends BaseSchema {
  public async up() {
    const schema = (this.schema as any)
    const has = await schema.hasColumn('discounts', 'is_auto')

    if (!has) {
      this.schema.alterTable('discounts', (table) => {
        table.tinyint('is_auto').notNullable().defaultTo(1)
        table.index(['is_auto'])
      })
    }
  }

  public async down() {
    const schema = (this.schema as any)
    const has = await schema.hasColumn('discounts', 'is_auto')

    if (has) {
      this.schema.alterTable('discounts', (table) => {
        table.dropIndex(['is_auto'])
        table.dropColumn('is_auto')
      })
    }
  }
}
