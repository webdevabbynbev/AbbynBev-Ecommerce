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
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .after('category_type_id')

      table
        .integer('persona_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('personas')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .after('brand_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['brand_id'])
      table.dropColumn('brand_id')

      table.dropForeign(['persona_id'])
      table.dropColumn('persona_id')
    })
  }
}
