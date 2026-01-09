import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'brands'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 150).notNullable().unique()
      table.string('slug', 150).notNullable().unique()
      table.text('description').nullable()
      table.string('logo_url').nullable()
      table.string('banner_url').nullable()
      table.string('country').nullable()
      table.string('website').nullable()
      table.boolean('is_active').defaultTo(1)
      table.dateTime('created_at').notNullable().defaultTo(this.now())
      table.dateTime('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
