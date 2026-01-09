import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_shipments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('service').nullable()
      table.string('service_type').nullable()
      table.decimal('price', 12, 2).nullable()
      table.text('address').nullable()
      table.text('resi_number').nullable()
      table.integer('province_id').nullable()
      table.integer('city_id').nullable()
      table.integer('district_id').nullable()
      table.integer('subdistrict_id').nullable()
      table.string('pic')
      table.string('pic_phone')
      table.string('postal_code', 30).nullable()
      table
        .integer('transaction_id')
        .unsigned()
        .nullable()
        .references('transactions.id')
        .onDelete('cascade')
        .onUpdate('cascade')
      table.string('estimation_arrival').nullable()
      table.boolean('is_protected').defaultTo(false)
      table.decimal('protection_fee', 12, 2).defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
