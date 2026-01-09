import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'variant_attributes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('product_variant_id')
        .unsigned()
        .nullable()
        .references('product_variants.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table
        .integer('attribute_value_id')
        .unsigned()
        .nullable()
        .references('attribute_values.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
