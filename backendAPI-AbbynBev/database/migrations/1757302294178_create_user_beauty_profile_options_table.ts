import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_beauty_profile_options'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .references('users.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table
        .integer('profile_category_options_id')
        .unsigned()
        .references('profile_category_options.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')

      table.unique(['user_id', 'profile_category_options_id'], 'uniq_user_beauty_profile')

      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
