import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sale_products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('sale_id')
        .unsigned()
        .references('sales.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table
        .integer('product_id')
        .unsigned()
        .references('products.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.decimal('sale_price', 12, 2).notNullable()
      table.integer('stock').defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
