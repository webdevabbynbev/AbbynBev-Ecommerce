import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('sku').unique().notNullable()
      table.string('barcode').unique().notNullable()
      table.string('price').notNullable()
      table.integer('stock').defaultTo(0)
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('products.id')
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
