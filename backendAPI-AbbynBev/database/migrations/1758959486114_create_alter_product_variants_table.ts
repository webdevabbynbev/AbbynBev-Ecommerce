import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('width').nullable()
      table.integer('height').nullable()
      table.integer('length').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('width')
      table.dropColumn('height')
      table.dropColumn('length')
    })
  }
}
