import { BaseSchema } from '@adonisjs/lucid/schema'

export default class DiscountsModuleTables extends BaseSchema {
  public async up() {
    /**
     * CUSTOMER GROUPS
     * - buat "kelompok pelanggan tertentu"
     */
    this.schema.createTable('customer_groups', (table) => {
      table.increments('id')
      table.string('name', 120).notNullable()
      table.text('description').nullable()
      table.tinyint('is_active').notNullable().defaultTo(1)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()

      table.index(['is_active'])
      table.index(['name'])
    })

    this.schema.createTable('customer_group_users', (table) => {
      table.increments('id')

      table
        .integer('customer_group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('customer_groups')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // user tidak boleh double join group yang sama
      table.unique(['customer_group_id', 'user_id'])

      table.index(['customer_group_id'])
      table.index(['user_id'])
    })

    /**
     * DISCOUNTS (MASTER)
     *
     * value_type:
     *  1 = PERCENTAGE
     *  2 = NOMINAL (amount)
     *
     * applies_to:
     *  0 = ALL_ORDERS       (Semua Pesanan)
     *  1 = MIN_ORDER        (Pesanan lebih / minimal)
     *  2 = COLLECTION       (Koleksi produk / kategori)
     *  3 = VARIANT          (Varian produk)
     *
     * eligibility_type:
     *  0 = ALL              (Semua orang)
     *  1 = USERS            (Pelanggan tertentu)
     *  2 = GROUPS           (Kelompok pelanggan tertentu)
     *
     * days_of_week_mask (bitmask 7 hari):
     *  Minggu=1, Senin=2, Selasa=4, Rabu=8, Kamis=16, Jumat=32, Sabtu=64
     *  semua hari = 127
     */
    this.schema.createTable('discounts', (table) => {
      table.increments('id')

      table.string('name', 120).nullable()
      table.string('code', 50).notNullable().unique()
      table.text('description').nullable()

      table.tinyint('value_type').notNullable().defaultTo(2) // default NOMINAL
      table.decimal('value', 12, 2).notNullable().defaultTo(0)
      table.decimal('max_discount', 12, 2).nullable() // cap jika percentage

      table.tinyint('applies_to').notNullable().defaultTo(0)
      table.decimal('min_order_amount', 12, 2).nullable() // untuk MIN_ORDER
      table.integer('min_order_qty').unsigned().nullable() // optional kalau mau minimal qty

      table.tinyint('eligibility_type').notNullable().defaultTo(0)

      // LIMIT PEMAKAIAN (global)
      // - usage_limit: null = unlimited
      // - usage_count: sudah USED
      // - reserved_count: sedang di-checkout (RESERVED)
      table.integer('usage_limit').unsigned().nullable()
      table.integer('usage_count').unsigned().notNullable().defaultTo(0)
      table.integer('reserved_count').unsigned().notNullable().defaultTo(0)

      table.tinyint('is_active').notNullable().defaultTo(1)

      // channel
      table.tinyint('is_ecommerce').notNullable().defaultTo(1)
      table.tinyint('is_pos').notNullable().defaultTo(0)

      // jadwal
      table.dateTime('started_at').nullable()
      table.dateTime('expired_at').nullable()
      table.integer('days_of_week_mask').unsigned().notNullable().defaultTo(127)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('deleted_at', { useTz: true }).nullable()

      // indexes buat query cepat
      table.index(['is_active'])
      table.index(['is_ecommerce'])
      table.index(['is_pos'])
      table.index(['applies_to'])
      table.index(['eligibility_type'])
      table.index(['started_at'])
      table.index(['expired_at'])
    })

    /**
     * DISCOUNT TARGETS
     * dipakai saat applies_to = COLLECTION atau VARIANT
     *
     * target_type:
     *  1 = CATEGORY_TYPE (koleksi / kategori)
     *  2 = PRODUCT_VARIANT (varian produk)
     *
     * NOTE:
     *  - Karena target_id bisa mengarah ke 2 table berbeda (category_types / product_variants),
     *    kita tidak pakai FK constraint biar fleksibel.
     *  - Validasi integritas dilakukan di service/controller.
     */
    this.schema.createTable('discount_targets', (table) => {
      table.increments('id')

      table
        .integer('discount_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('discounts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.tinyint('target_type').notNullable()
      table.integer('target_id').unsigned().notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // cegah double target
      table.unique(['discount_id', 'target_type', 'target_id'])

      table.index(['discount_id'])
      table.index(['target_type', 'target_id'])
    })

    /**
     * DISCOUNT ELIGIBILITY (pelanggan tertentu)
     * dipakai kalau eligibility_type = USERS
     */
    this.schema.createTable('discount_customer_users', (table) => {
      table.increments('id')

      table
        .integer('discount_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('discounts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['discount_id', 'user_id'])

      table.index(['discount_id'])
      table.index(['user_id'])
    })

    /**
     * DISCOUNT ELIGIBILITY (kelompok pelanggan)
     * dipakai kalau eligibility_type = GROUPS
     */
    this.schema.createTable('discount_customer_groups', (table) => {
      table.increments('id')

      table
        .integer('discount_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('discounts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('customer_group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('customer_groups')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['discount_id', 'customer_group_id'])

      table.index(['discount_id'])
      table.index(['customer_group_id'])
    })

    /**
     * DISCOUNT REDEMPTIONS
     * buat flow reserve / used / cancel
     *
     * status:
     *  0 = RESERVED  (lagi dipakai di checkout - kuota dikunci)
     *  1 = USED      (pembayaran sukses)
     *  2 = CANCELLED (payment gagal/expire)
     *
     * NOTE:
     * - V1: 1 transaksi = 1 diskon, jadi transaction_id unique
     */
    this.schema.createTable('discount_redemptions', (table) => {
      table.increments('id')

      table
        .integer('discount_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('discounts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')

      // snapshot kode diskon saat dipakai (audit)
      table.string('discount_code', 50).notNullable()

      table.tinyint('status').notNullable().defaultTo(0)

      table.dateTime('reserved_at').nullable()
      table.dateTime('used_at').nullable()
      table.dateTime('cancelled_at').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // v1: satu transaksi hanya boleh 1 diskon
      table.unique(['transaction_id'])

      table.index(['discount_id'])
      table.index(['user_id'])
      table.index(['status'])
    })
  }

  public async down() {
    // drop reverse order (biar FK aman)
    this.schema.dropTable('discount_redemptions')
    this.schema.dropTable('discount_customer_groups')
    this.schema.dropTable('discount_customer_users')
    this.schema.dropTable('discount_targets')
    this.schema.dropTable('discounts')
    this.schema.dropTable('customer_group_users')
    this.schema.dropTable('customer_groups')
  }
}
