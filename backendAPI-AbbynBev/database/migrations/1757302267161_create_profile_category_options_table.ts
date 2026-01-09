import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profile_category_options'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('profile_categories_id')
        .unsigned()
        .references('profile_categories.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table.string('label', 100).notNullable()
      table.string('value', 100).notNullable()
      table.boolean('is_active').defaultTo(true)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
