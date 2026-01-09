import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ProductMedia from '#models/product_media'
import ProductOnline from '#models/product_online'
import Review from '#models/review'

import CategoryType from '#models/category_type'
import Brand from '#models/brand'
import Persona from '#models/persona'
import User from '#models/user'

import { generateSlug } from '../../app/utils/helpers.js'

export default class ProductSeeder extends BaseSeeder {
  public async run() {
    // Ambil master data
    const categories = await CategoryType.query().apply((s) => s.active())
    const brands = await Brand.query().apply((s) => s.active())
    const personas = await Persona.query().apply((s) => s.active())
    const users = await User.query().orderBy('id', 'asc')

    if (!categories.length) throw new Error('Category kosong. Jalankan category seeder dulu.')
    if (!brands.length) throw new Error('Brand kosong. Jalankan brand seeder dulu.')
    if (!personas.length) throw new Error('Persona kosong. Jalankan persona seeder dulu.')
    if (!users.length) throw new Error('User kosong. Jalankan user seeder dulu.')

    // GANTI dengan filename yang beneran ada di backendAPI-AbbynBev/storage
    const imageKeys = [
      '1760672159219_WhatsApp_Image_2025-09-24_at_10.58.40_094beeed.jpg',
      '1761292265319_UGC-pic3.png',
      '1764304215533_Winnie-the-pooh-slides.jpg',
    ]

    const seedProducts = [
      {
        name: 'Skintific 5X Ceramide Barrier Moisturizer',
        categorySlug: 'skincare',
        brandSlug: 'skintific',
        personaSlug: 'abby',
        basePrice: 129000,
        stock: 120,
        weight: 200,
        images: [imageKeys[0]],
        description: 'Moisturizer untuk memperkuat skin barrier.',
      },
      {
        name: 'Wardah Lightening Facial Wash',
        categorySlug: 'skincare',
        brandSlug: 'wardah',
        personaSlug: 'bev',
        basePrice: 35000,
        stock: 200,
        weight: 120,
        images: [imageKeys[1]],
        description: 'Facial wash gentle untuk daily use.',
      },
      {
        name: 'Make Over Powerstay Matte Powder',
        categorySlug: 'makeup',
        brandSlug: 'make-over',
        personaSlug: 'abby',
        basePrice: 155000,
        stock: 80,
        weight: 80,
        images: [imageKeys[2]],
        description: 'Matte powder tahan lama untuk hasil halus.',
      },
    ]

    const bySlug = <T extends { slug: string }>(rows: T[]) =>
      Object.fromEntries(rows.map((r) => [r.slug, r]))

    const catMap = bySlug(categories)
    const brandMap = bySlug(brands)
    const personaMap = bySlug(personas)

    for (let i = 0; i < seedProducts.length; i++) {
      const item = seedProducts[i]

      const category = catMap[item.categorySlug] ?? categories[0]
      const brand = brandMap[item.brandSlug] ?? brands[0]
      const persona = personaMap[item.personaSlug] ?? personas[0]

      const slug = await generateSlug(item.name)
      const path = `${category.slug}/${slug}`
      const masterSku = `AB-${String(i + 1).padStart(4, '0')}`

      // 1) Product
      const product = await Product.firstOrCreate(
        { slug },
        {
          name: item.name,
          slug,
          description: item.description,
          basePrice: item.basePrice,
          weight: item.weight ?? 0,
          isFlashsale: false,
          status: 'normal',
          categoryTypeId: category.id,
          brandId: brand.id,
          personaId: persona.id,
          path,
          masterSku,
          position: i + 1,
          popularity: 0,
          metaTitle: item.name,
          metaDescription: item.description,
          metaKeywords: `${category.slug},${brand.slug}`,
        }
      )

      // 2) Publish online (BIAR MUNCUL DI /api/v1/products)
      await ProductOnline.firstOrCreate(
        { productId: product.id },
        { productId: product.id, isActive: true, publishedAt: DateTime.now() }
      )

      // 3) Variant (harga & stok)
      const sku = `${masterSku}-01`
      const barcode = `BR-${product.id}-${DateTime.now().toMillis()}-${i}`

      await ProductVariant.firstOrCreate(
        { sku },
        {
          sku,
          barcode,
          price: String(item.basePrice),
          stock: item.stock ?? 0,
          productId: product.id,
          width: null,
          height: null,
          length: null,
        }
      )

      // 4) Media (gambar)
      for (const key of item.images) {
        await ProductMedia.firstOrCreate(
          { productId: product.id, url: key },
          { productId: product.id, url: key, altText: product.name, type: 1 }
        )
      }

      // 5) Reviews (biar avg_rating & review_count keisi)
      const u1 = users[(i * 2) % users.length]
      const u2 = users[(i * 2 + 1) % users.length]

      await Review.firstOrCreate(
        { userId: u1.id, productId: product.id },
        {
          userId: u1.id,
          productId: product.id,
          rating: 5,
          comment: 'Bagus banget, repeat order.',
          images: [],
          isVerifiedPurchase: true,
          likes: 0,
        }
      )

      await Review.firstOrCreate(
        { userId: u2.id, productId: product.id },
        {
          userId: u2.id,
          productId: product.id,
          rating: 4,
          comment: 'Sesuai ekspektasi, pengiriman cepat.',
          images: [],
          isVerifiedPurchase: false,
          likes: 0,
        }
      )
    }
  }
}
