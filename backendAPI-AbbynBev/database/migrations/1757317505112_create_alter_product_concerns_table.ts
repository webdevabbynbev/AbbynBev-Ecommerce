import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterProductConcernsAddConcernOption extends BaseSchema {
  protected tableName = 'product_concerns'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('concern_option_id')
        .unsigned()
        .notNullable()
        .after('product_id')
        .references('concern_options.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.unique(['product_id', 'concern_option_id'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['concern_option_id'])
      table.dropUnique(['product_id', 'concern_option_id'])
      table.dropColumn('concern_option_id')
    })
  }
}
