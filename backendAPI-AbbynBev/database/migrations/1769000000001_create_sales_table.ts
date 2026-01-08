import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').nullable()
      table.text('description').nullable()
      table.boolean('has_button').defaultTo(false)
      table.string('button_text').nullable()
      table.string('button_url').nullable()
      table.dateTime('start_datetime').notNullable()
      table.dateTime('end_datetime').notNullable()
      table.boolean('is_publish').defaultTo(false)
      table.integer('created_by').unsigned().nullable().references('users.id')
      table.integer('updated_by').unsigned().nullable().references('users.id')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}