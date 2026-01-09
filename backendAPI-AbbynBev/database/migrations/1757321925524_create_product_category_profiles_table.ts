import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ProductCategoryProfiles extends BaseSchema {
  protected tableName = 'product_category_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table
        .integer('profile_category_options_id')
        .unsigned()
        .references('id')
        .inTable('profile_category_options')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.unique(['product_id', 'profile_category_options_id'], 'uniq_prod_cat_opt')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
