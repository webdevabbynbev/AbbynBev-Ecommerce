import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      table.string('email', 255).notNullable().unique()
      table.string('phone', 30).nullable()
      table.boolean('email_verified').defaultTo(false)
      table.string('password', 180).notNullable()
      table.string('remember_me_token').nullable()
      table.tinyint('is_active').defaultTo(1)
      table.tinyint('role').defaultTo(1)
      table.string('photo_profile').nullable()
      table.date('dob').nullable()
      table.string('phone_number').nullable()
      table.tinyint('gender').nullable()
      table.string('google_id').nullable()
      table.integer('created_by').unsigned()
      table.integer('updated_by').unsigned()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
