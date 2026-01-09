import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.decimal('base_price', 12, 2).nullable()
      table.integer('weight').defaultTo(0)
      table.boolean('is_flashsale').defaultTo(false)
      table.enum('status', ['normal', 'war', 'draft']).defaultTo('draft')
      table
        .integer('category_type_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('category_types')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.text('meta_title').nullable()
      table.text('meta_description').nullable()
      table.text('meta_keywords').nullable()
      table.integer('popularity').nullable()
      table.integer('position').nullable()
      table.text('path').nullable()
      table.timestamp('deleted_at').nullable().defaultTo(null)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
