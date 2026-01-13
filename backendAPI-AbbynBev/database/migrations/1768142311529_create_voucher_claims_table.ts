import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'voucher_claims'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('voucher_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vouchers')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      /**
       * 0 = CLAIMED
       * 1 = RESERVED (lagi dipake di checkout, nempel ke transaction)
       * 2 = USED (udah sukses dipakai)
       */
      table.tinyint('status').notNullable().defaultTo(0)

      table
        .integer('transaction_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transactions')
        .onDelete('SET NULL')

      table.dateTime('claimed_at').notNullable()
      table.dateTime('reserved_at').nullable()
      table.dateTime('used_at').nullable()

      // ✅ FIX: kasih default CURRENT_TIMESTAMP supaya MySQL tidak error
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // user cuma boleh claim 1x untuk voucher yang sama
      table.unique(['voucher_id', 'user_id'])

      table.index(['user_id'])
      table.index(['voucher_id'])
      table.index(['transaction_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
