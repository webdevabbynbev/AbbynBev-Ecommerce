import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_medias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('url').notNullable()
      table.text('alt_text').nullable()

      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('products.id')
        .onDelete('cascade')
        .onUpdate('cascade')

      table.tinyint('type').defaultTo(1)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
