import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attribute_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('value').notNullable()
      table
        .integer('attribute_id')
        .unsigned()
        .nullable()
        .references('attributes.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.timestamp('deleted_at').nullable().defaultTo(null)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
