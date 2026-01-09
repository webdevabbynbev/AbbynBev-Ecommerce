import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('address').nullable()
      table.tinyint('is_active').defaultTo(1)
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('users.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.integer('city').nullable()
      table.integer('province').nullable()
      table.integer('district').nullable()
      table.integer('sub_district').nullable()
      table.string('postal_code', 30).nullable()
      table.string('pic_name').nullable()
      table.string('pic_phone').nullable()
      table.string('pic_label').nullable()
      table.string('benchmark').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
