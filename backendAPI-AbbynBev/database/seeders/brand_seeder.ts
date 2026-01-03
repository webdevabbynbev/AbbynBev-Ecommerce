import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Brand from '#models/brand'
import { DateTime } from 'luxon'
import Helpers from '../../app/utils/helpers.js' // sesuaikan path helpers kamu

export default class BrandSeeder extends BaseSeeder {
  public async run() {
    const brands = [
      {
        name: 'Skintific',
        description: 'Skincare brand dengan teknologi TTE (Trilogy Technology Efficacy).',
        logoUrl: 'http://localhost:3333/uploads/skintific.png',
        bannerUrl: 'http://localhost:3333/uploads/skintific-banner.png',
        country: 'Indonesia',
        website: 'https://skintific.com',
      },
      {
        name: 'Make Over',
        description: 'Brand makeup profesional dengan produk high performance.',
        logoUrl: 'http://localhost:3333/uploads/makeover.png',
        bannerUrl: 'http://localhost:3333/uploads/makeover-banner.png',
        country: 'Indonesia',
        website: 'https://makeoverforall.com',
      },
      {
        name: 'Wardah',
        description: 'Brand kosmetik halal terkemuka di Indonesia.',
        logoUrl: 'http://localhost:3333/uploads/wardah.png',
        bannerUrl: 'http://localhost:3333/uploads/wardah-banner.png',
        country: 'Indonesia',
        website: 'https://wardahbeauty.com',
      },
      {
        name: 'Emina',
        description: 'Brand kosmetik fun & youthful untuk Gen Z.',
        logoUrl: 'http://localhost:3333/uploads/emina.png',
        bannerUrl: 'http://localhost:3333/uploads/emina-banner.png',
        country: 'Indonesia',
        website: 'https://eminacosmetics.com',
      },
      {
        name: 'Timephoria',
        description: 'Brand skincare lokal dengan konsep therapeutic self-care.',
        logoUrl: 'http://localhost:3333/uploads/timephoria.png',
        bannerUrl: 'http://localhost:3333/uploads/timephoria-banner.png',
        country: 'Indonesia',
        website: 'https://timephoria.id',
      },
      {
        name: 'Kahf',
        description: 'Brand personal care pria dengan natural ingredients.',
        logoUrl: 'http://localhost:3333/uploads/kahf.png',
        bannerUrl: 'http://localhost:3333/uploads/kahf-banner.png',
        country: 'Indonesia',
        website: 'https://kahf.com',
      },
      {
        name: 'BLP',
        description: 'By Lizzie Parra – brand makeup lokal populer dengan kualitas internasional.',
        logoUrl: 'http://localhost:3333/uploads/blp.png',
        bannerUrl: 'http://localhost:3333/uploads/blp-banner.png',
        country: 'Indonesia',
        website: 'https://blpbeauty.com',
      },
      {
        name: 'ESQA',
        description: 'Brand vegan makeup pertama di Indonesia.',
        logoUrl: 'http://localhost:3333/uploads/esqa.png',
        bannerUrl: 'http://localhost:3333/uploads/esqa-banner.png',
        country: 'Indonesia',
        website: 'https://esqacosmetics.com',
      },
      {
        name: 'Luxcrime',
        description: 'Local brand dengan produk makeup & skincare berkualitas.',
        logoUrl: 'http://localhost:3333/uploads/luxcrime.png',
        bannerUrl: 'http://localhost:3333/uploads/luxcrime-banner.png',
        country: 'Indonesia',
        website: 'https://luxcrime.com',
      },
      {
        name: 'Guele',
        description: 'Premium local brand dengan fokus complexion & base makeup.',
        logoUrl: 'http://localhost:3333/uploads/guele.png',
        bannerUrl: 'http://localhost:3333/uploads/guele-banner.png',
        country: 'Indonesia',
        website: 'https://guele.id',
      },
    ]

    for (const b of brands) {
      await Brand.create({
        ...b,
        slug: await Helpers.generateSlug(b.name),
        isActive: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      })
    }
  }
}
