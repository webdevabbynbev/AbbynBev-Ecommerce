import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ramadan_spin_prizes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('daily_quota').nullable().defaultTo(null)
      table.integer('voucher_id').unsigned().nullable().references('id').inTable('vouchers')
      table.integer('voucher_qty').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('daily_quota')
      table.dropColumn('voucher_id')
      table.dropColumn('voucher_qty')
    })
  }
}
