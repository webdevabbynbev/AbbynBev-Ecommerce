import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_details'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('qty').defaultTo(0)
      table.decimal('price', 12, 2).nullable()
      table.decimal('amount', 12, 2).nullable()
      table.decimal('discount', 12, 2).nullable()
      table.text('attributes').nullable()
      table
        .integer('product_variant_id')
        .unsigned()
        .nullable()
        .references('product_variants.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('products.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table
        .integer('transaction_id')
        .unsigned()
        .nullable()
        .references('transactions.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
