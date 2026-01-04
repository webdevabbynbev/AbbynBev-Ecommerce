import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'category_types'

  private async hasColumn(column: string) {
    const result: any = await this.db.rawQuery(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [this.tableName, column]
    )

    // mysql2 umumnya balikin [rows, fields]
    const rows = Array.isArray(result) ? result[0] : (result?.rows ?? result)
    return Number(rows?.[0]?.total ?? 0) > 0
  }

  async up() {
    if (await this.hasColumn('icon_public_id')) return

    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon_public_id', 255).nullable()
    })
  }

  async down() {
    if (!(await this.hasColumn('icon_public_id'))) return

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('icon_public_id')
    })
  }
}