import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ramadan_spin_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('users.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table
        .integer('prize_id')
        .unsigned()
        .references('ramadan_spin_prizes.id')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.index(['user_id'])
      table.index(['prize_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
