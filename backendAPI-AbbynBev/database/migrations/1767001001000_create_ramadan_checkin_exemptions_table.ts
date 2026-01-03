import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ramadan_checkin_exemptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .references('users.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.date('exempt_date').notNullable()
      table.string('reason', 100).notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.unique(['user_id', 'exempt_date'])
      table.index(['user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
