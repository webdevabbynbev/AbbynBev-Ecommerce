import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  private async hasColumn(table: string, column: string) {
    const result: any = await this.db.rawQuery(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [table, column]
    )

    const rows = Array.isArray(result) ? result[0] : (result?.rows ?? result)
    return Number(rows?.[0]?.total ?? 0) > 0
  }

  async up() {
    if (await this.hasColumn(this.tableName, 'is_flash_sale')) return

    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_flash_sale').notNullable().defaultTo(false)
    })
  }

  async down() {
    if (!(await this.hasColumn(this.tableName, 'is_flash_sale'))) return

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_flash_sale')
    })
  }
}