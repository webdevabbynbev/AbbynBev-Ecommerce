import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('transaction_number').notNullable().unique()
      table.decimal('amount', 12, 2).notNullable()
      table.decimal('discount', 12, 2).defaultTo(0)
      table.tinyint('discount_type').defaultTo(0)
      table.decimal('sub_total', 12, 2).notNullable()
      table.decimal('grand_total', 12, 2).notNullable()
      table.tinyint('transaction_status').defaultTo(1)
      table.enum('channel', ['ecommerce', 'pos']).notNullable()
      table
        .integer('user_id')
        .unsigned()
        .references('users.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.text('note').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
