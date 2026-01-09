import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_shipments'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('delivered_at', { useTz: true }).nullable().after('estimation_arrival')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivered_at')
    })
  }
}
