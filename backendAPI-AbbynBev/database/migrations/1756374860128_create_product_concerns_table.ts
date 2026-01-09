import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateProductConcerns extends BaseSchema {
  protected tableName = 'product_concerns'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('products.id')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
