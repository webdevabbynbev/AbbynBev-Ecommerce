import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('brand_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('brands')
        .onDelete('SET NULL')

      table
        .integer('persona_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('personas')
        .onDelete('SET NULL')

      table.string('master_sku').nullable().index()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('brand_id')
      table.dropColumn('persona_id')
      table.dropColumn('master_sku')
    })
  }
}
