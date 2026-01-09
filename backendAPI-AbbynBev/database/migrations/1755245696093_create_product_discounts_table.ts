import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_discounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.tinyint('type').defaultTo(1)
      table.string('value').notNullable()
      table.string('max_value').nullable()
      table.dateTime('start_date').nullable()
      table.dateTime('end_date').nullable()
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('products.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
