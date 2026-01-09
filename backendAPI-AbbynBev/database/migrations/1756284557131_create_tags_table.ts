import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tags'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable().unique()
      table.string('slug', 120).notNullable().unique()
      table.text('description').nullable()
      table.dateTime('created_at').notNullable().defaultTo(this.now())
      table.dateTime('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
