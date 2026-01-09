import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'flashsale_products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('flash_sale_id')
        .unsigned()
        .references('flash_sales.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table
        .integer('product_id')
        .unsigned()
        .references('products.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table.decimal('flash_price', 12, 2).notNullable()
      table.integer('stock').notNullable().defaultTo(0)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
