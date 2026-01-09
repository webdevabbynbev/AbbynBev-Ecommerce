import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vouchers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').nullable()
      table.string('code', 30).nullable()
      table.string('price', 30).nullable()
      table.string('max_disc_price', 30).nullable()
      table.integer('percentage').defaultTo(0)
      table.tinyint('is_percentage').defaultTo(0)
      table.tinyint('is_active').defaultTo(1)
      table.tinyint('type').defaultTo(1)
      table.integer('qty').defaultTo(0)
      table.dateTime('expired_at').nullable()
      table.dateTime('started_at').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
