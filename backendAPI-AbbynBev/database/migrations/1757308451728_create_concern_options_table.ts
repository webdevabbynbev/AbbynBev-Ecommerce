import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'concern_options'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('concern_id')
        .unsigned()
        .references('concerns.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table.string('name').notNullable()
      table.string('slug', 150).notNullable().unique()
      table.text('description').nullable()
      table.integer('position').defaultTo(0)

      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
