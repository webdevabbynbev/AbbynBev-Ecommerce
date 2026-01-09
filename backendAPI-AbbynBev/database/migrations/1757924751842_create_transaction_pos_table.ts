import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_pos'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('transaction_id')
        .unsigned()
        .references('transactions.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('cashier_id')
        .unsigned()
        .references('users.id')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .nullable()
      table.string('payment_method').notNullable()
      table.decimal('received_amount', 12, 2).defaultTo(0)
      table.decimal('change_amount', 12, 2).defaultTo(0)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
