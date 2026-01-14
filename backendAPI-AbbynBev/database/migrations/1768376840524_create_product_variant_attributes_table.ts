import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductVariantAttributes extends BaseSchema {
  protected tableName = 'product_variant_attributes'

  async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('product_variant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')

      table
        .integer('attribute_value_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('attribute_values')
        .onDelete('CASCADE')

      table.unique(
        ['product_variant_id', 'attribute_value_id'],
        'pva_variant_attr_unique'
      )

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down () {
    this.schema.dropTable(this.tableName)
  }
}
