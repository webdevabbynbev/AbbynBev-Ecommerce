import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

import Sale from '#models/sale'
import Product from '#models/product'
import User from '#models/user'

export default class SaleSeeder extends BaseSeeder {
  public async run() {
    // ✅ ambil 30 produk, bukan 4
    const products = await Product.query().orderBy('id', 'asc').limit(30)
    if (products.length < 30) {
      throw new Error(
        'Produk kurang dari 30. Jalankan product seeder dulu atau seed minimal 30 produk.'
      )
    }

    const user = await User.query().orderBy('id', 'asc').first()
    const now = DateTime.now()

    for (let i = 0; i < 30; i++) {
      const title = `Sale Produk Dummy ${i + 1}`
      const startDatetime = now.minus({ hours: 2 }).plus({ hours: i })
      const endDatetime = startDatetime.plus({ days: 7 })

      const sale = await Sale.firstOrCreate(
        { title },
        {
          title,
          description: 'Promo sale produk untuk data dummy CMS.',
          hasButton: true,
          buttonText: 'Belanja Sekarang',
          buttonUrl: '/sale',
          startDatetime,
          endDatetime,
          isPublish: true,
          createdBy: user?.id ?? null,
          updatedBy: user?.id ?? null,
        }
      )

      sale.merge({
        description: 'Promo sale produk untuk data dummy CMS.',
        hasButton: true,
        buttonText: 'Belanja Sekarang',
        buttonUrl: '/sale',
        startDatetime,
        endDatetime,
        isPublish: true,
        updatedBy: user?.id ?? null,
      })
      await sale.save()

      const pivotData = Object.fromEntries(
        products.map((product, index) => [
          product.id,
          {
            sale_price: Math.max(1000, Math.round(Number(product.basePrice ?? 0) * 0.85)),
            // catatan: untuk 30 produk, rumus ini juga akan cepat mentok di 10
            stock: Math.max(10, 25 - index * 3),
          },
        ])
      )

      await sale.related('products').sync(pivotData)
    }
  }
}
