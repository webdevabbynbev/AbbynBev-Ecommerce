import { BaseSchema } from '@adonisjs/lucid/schema'

export default class FlashSales extends BaseSchema {
  protected tableName = 'flash_sales'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').nullable()
      table.string('description').nullable()
      table.boolean('has_button').defaultTo(false)
      table.string('button_text').nullable()
      table.string('button_url').nullable()
      table.dateTime('start_datetime').notNullable()
      table.dateTime('end_datetime').notNullable()
      table.boolean('is_publish').defaultTo(true)
      table.integer('created_by').nullable()
      table.integer('updated_by').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
