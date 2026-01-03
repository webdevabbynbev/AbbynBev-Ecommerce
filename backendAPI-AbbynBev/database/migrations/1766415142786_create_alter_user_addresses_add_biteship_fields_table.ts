import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // kolom baru untuk Biteship (search)
      table.string('biteship_area_id', 120).nullable()
      table.string('biteship_area_name', 255).nullable()

      // biar dropdown lama tidak wajib lagi (alamat baru boleh kosong)
      table.integer('province').nullable().alter()
      table.integer('city').nullable().alter()
      table.integer('district').nullable().alter()
      table.integer('sub_district').nullable().alter()

      // optional: index biar lookup cepat
      table.index(['biteship_area_id'])
      table.index(['postal_code'])
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['biteship_area_id'])
      table.dropIndex(['postal_code'])

      table.dropColumn('biteship_area_id')
      table.dropColumn('biteship_area_name')

      // balikin lagi kalau memang mau strict (opsional)
      table.integer('province').notNullable().alter()
      table.integer('city').notNullable().alter()
      table.integer('district').notNullable().alter()
      table.integer('sub_district').notNullable().alter()
    })
  }
}
