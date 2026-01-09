import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_tags'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.integer('tag_id').unsigned().references('id').inTable('tags').onDelete('CASCADE')
      table.date('start_date').nullable()
      table.date('end_date').nullable()
      table.dateTime('created_at').notNullable().defaultTo(this.now())
      table.dateTime('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
      table.unique(['product_id', 'tag_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
