import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'support_tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.string('email', 255).notNullable()
      table.string('phone', 20).nullable()
      table.string('subject', 255).notNullable()
      table.text('message').notNullable()
      table.enum('status', ['pending', 'in_progress', 'resolved']).defaultTo('pending')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
