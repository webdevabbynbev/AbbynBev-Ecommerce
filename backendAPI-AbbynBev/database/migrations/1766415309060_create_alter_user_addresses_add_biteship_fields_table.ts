import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('province').nullable().alter()
      table.integer('city').nullable().alter()
      table.integer('district').nullable().alter()
      table.integer('sub_district').nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('province').notNullable().alter()
      table.integer('city').notNullable().alter()
      table.integer('district').notNullable().alter()
      table.integer('sub_district').notNullable().alter()
    })
  }
}
