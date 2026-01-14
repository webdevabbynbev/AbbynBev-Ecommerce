import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attribute_values'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('product_variant_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')

      table.index(['product_variant_id'])

      // biar 1 attribute (misal "variant") cuma punya 1 value per product_variant
      table.unique(['attribute_id', 'product_variant_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['attribute_id', 'product_variant_id'])
      table.dropIndex(['product_variant_id'])
      table.dropColumn('product_variant_id')
    })
  }
}
