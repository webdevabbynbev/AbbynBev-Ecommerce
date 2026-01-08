import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ramadan_product_recommendations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Foreign Key ke tabel Products
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')

      // Tanggal rekomendasi (YYYY-MM-DD)
      table.date('recommendation_date').notNullable()

      // Status aktif
      table.boolean('is_active').defaultTo(true)

      /**
       * PERBAIKAN: Gunakan helper timestamps(true, true)
       * true pertama: useTz (gunakan timezone jika dikonfigurasi)
       * true kedua: defaultToNow (set default CURRENT_TIMESTAMP) <- Ini yang memperbaiki error
       */
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
