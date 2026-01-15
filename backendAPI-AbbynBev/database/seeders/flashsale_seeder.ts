import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

import FlashSale from '#models/flashsale'
import Product from '#models/product'
import User from '#models/user'

export default class FlashSaleSeeder extends BaseSeeder {
  public async run() {
    // ✅ ambil 30 produk, bukan 3
    const products = await Product.query().orderBy('id', 'asc').limit(30)
    if (products.length < 30) {
      throw new Error(
        'Produk kurang dari 30. Jalankan product seeder dulu atau seed minimal 30 produk.'
      )
    }

    const user = await User.query().orderBy('id', 'asc').first()
    const now = DateTime.now()

    for (let i = 0; i < 30; i++) {
      const title = `Flash Sale Dummy ${i + 1}`
      const startDatetime = now.minus({ hours: 1 }).plus({ hours: i })
      const endDatetime = startDatetime.plus({ days: 2 })

      const flashSale = await FlashSale.firstOrCreate(
        { title },
        {
          title,
          description: 'Promo flash sale untuk data dummy CMS.',
          hasButton: true,
          buttonText: 'Lihat Flash Sale',
          buttonUrl: '/flash-sale',
          startDatetime,
          endDatetime,
          isPublish: true,
          createdBy: user?.id ?? null,
          updatedBy: user?.id ?? null,
        }
      )

      flashSale.merge({
        description: 'Promo flash sale untuk data dummy CMS.',
        hasButton: true,
        buttonText: 'Lihat Flash Sale',
        buttonUrl: '/flash-sale',
        startDatetime,
        endDatetime,
        isPublish: true,
        updatedBy: user?.id ?? null,
      })
      await flashSale.save()

      const pivotData = Object.fromEntries(
        products.map((product, index) => [
          product.id,
          {
            flash_price: Math.max(1000, Math.round(Number(product.basePrice ?? 0) * 0.8)),
            // catatan: dengan 30 produk, rumus lama akan cepat mentok di 10
            stock: Math.max(10, 20 - index * 2),
          },
        ])
      )

      await flashSale.related('products').sync(pivotData)
    }

    await Product.query()
      .whereIn(
        'id',
        products.map((product) => product.id)
      )
      .update({ isFlashSale: true })
  }
}
