import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import Setting from '#models/setting'
import { SettingType } from '../../../enums/setting_types.js'
import Faq from '#models/faq'
import FlashSale from '#models/flashsale'
import Sale from '#models/sale'
import { DateTime } from 'luxon'
import { DiscountPricingService } from '#services/discount/discount_pricing_service'

type PromoKind = 'flash' | 'sale'

export default class HomeController {
  private toISO(v: any): string | null {
    if (v && typeof v.toISO === 'function') return v.toISO()
    if (typeof v === 'string') return v
    return null
  }

  private nowWib() {
    const now = DateTime.now().setZone('Asia/Jakarta')
    const nowStr = now.toFormat('yyyy-LL-dd HH:mm:ss')
    return { now, nowStr }
  }

  private basePrice(p: any): number {
    const variants = Array.isArray(p?.variants) ? p.variants : []
    const variantPrices = variants
      .map((variant: any) => Number(variant?.price))
      .filter((value: number) => Number.isFinite(value) && value > 0)
    const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : null

    return Number(minVariantPrice ?? p?.basePrice ?? p?.base_price ?? p?.price ?? 0)
  }

  private firstImageUrl(p: any): string | null {
    const medias = Array.isArray(p?.medias) ? p.medias : []
    return medias.length ? (medias[0]?.url ?? null) : null
  }

  private preloadPromoProducts(q: any, kind: PromoKind) {
    if (kind === 'flash') q.pivotColumns(['flash_price', 'stock'])
    else q.pivotColumns(['sale_price', 'stock'])

    q.whereExists((sub: any) => {
      sub
        .from('product_onlines as po')
        .whereColumn('po.product_id', 'products.id')
        .where('po.is_active', 1)
    })

    q.whereNull('products.deleted_at')
    q.preload('medias', (mq: any) => mq.orderBy('id', 'asc'))
    q.preload('variants', (variantQuery: any) => {
      variantQuery
        .select(['id', 'price', 'stock', 'product_id'])
        .whereNull('product_variants.deleted_at')
    })
    q.preload('brand', (bq: any) => bq.select(['id', 'name', 'slug']))
    q.preload('categoryType', (cq: any) => cq.select(['id', 'name']))
  }

  private mapPromoProducts(products: any[], kind: PromoKind) {
    const priceKey = kind === 'flash' ? 'pivot_flash_price' : 'pivot_sale_price'
    const mappedKey = kind === 'flash' ? 'flashPrice' : 'salePrice'

    return (products || []).map((p: any) => {
      const promoPrice = Number(p?.$extras?.[priceKey] ?? 0)
      const stock = Number(p?.$extras?.pivot_stock ?? 0)

      const normalPrice = this.basePrice(p)
      const baseForCode = promoPrice > 0 ? promoPrice : normalPrice

      return {
        id: p.id,
        name: p.name,
        slug: p.slug ?? null,
        path: p.path ?? null,

        // harga normal (buat coret di FE kalau mau)
        price: normalPrice,

        // ✅ harga yang jadi dasar perhitungan "dengan kode"
        basePrice: baseForCode,

        // promo price (flash/sale)
        [mappedKey]: promoPrice,
        stock,

        // ✅ supaya discount appliesTo BRAND / COLLECTION jalan
        brandId: p.brand?.id ?? null,
        categoryTypeId: p.categoryType?.id ?? null,

        image: this.firstImageUrl(p),
        brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
        categoryType: p.categoryType ? { id: p.categoryType.id, name: p.categoryType.name } : null,
      }
    })
  }

  private stripHelperFields(products: any[]) {
    return (products || []).map((p: any) => {
      const { basePrice, brandId, categoryTypeId, ...rest } = p || {}
      return rest
    })
  }

  // =========================
  // STATIC PAGES
  // =========================
  public async getBanner({ response }: HttpContext) {
    try {
      const banners = await Banner.query()
        .apply((s) => s.active())
        .orderBy('order', 'asc')
      return response.status(200).send({ message: 'Success', serve: banners })
    } catch (e: any) {
      console.error(e)
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getTermAndCondition({ response }: HttpContext) {
    try {
      const termAndCondition = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.TERM_AND_CONDITIONS)
        .first()

      return response.status(200).send({ message: 'Success', serve: termAndCondition })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getReturnPolicy({ response }: HttpContext) {
    try {
      const returnPolicy = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.RETURN_POLICY)
        .first()

      return response.status(200).send({ message: 'Success', serve: returnPolicy })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getPrivacyPolicy({ response }: HttpContext) {
    try {
      const privacy = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.PRIVACY_POLICY)
        .first()

      return response.status(200).send({ message: 'Success', serve: privacy })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getContactSupport({ response }: HttpContext) {
    try {
      const contact = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.CONTACT_US)
        .first()

      return response.status(200).send({ message: 'Success', serve: contact })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getFaq({ response }: HttpContext) {
    try {
      const faqs = await Faq.query().select('question', 'answer')
      return response.status(200).send({
        message: 'Success',
        serve: faqs.map((f) => ({ question: f.question, answer: f.answer })),
      })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getAboutUs({ response }: HttpContext) {
    try {
      const aboutUs = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.ABOUT_US)
        .first()

      return response.status(200).send({ message: 'Success', serve: aboutUs })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  // =========================
  // PROMO: FLASH SALE
  // =========================
  public async getFlashSale({ response }: HttpContext) {
    try {
      const { nowStr } = this.nowWib()

      const flashSale = await FlashSale.query()
        .where('is_publish', 1 as any)
        .where('start_datetime', '<=', nowStr)
        .where('end_datetime', '>=', nowStr)
        .orderBy('start_datetime', 'desc')
        .preload('products', (q) => this.preloadPromoProducts(q, 'flash'))
        .first()

      if (!flashSale) {
        return response.status(200).send({
          message: 'No active flash sale',
          serve: null,
          meta: { nowStr, timezone: 'Asia/Jakarta' },
        })
      }

      // ✅ map + attach extraDiscount
      const products = this.mapPromoProducts(flashSale.products, 'flash')
      const svc = new DiscountPricingService()
      await svc.attachExtraDiscount(products as any[])
      const cleanProducts = this.stripHelperFields(products)

      return response.status(200).send({
        message: 'Success',
        serve: {
          id: flashSale.id,
          title: flashSale.title,
          description: flashSale.description,
          hasButton: flashSale.hasButton,
          buttonText: flashSale.buttonText,
          buttonUrl: flashSale.buttonUrl,
          startDatetime: this.toISO(flashSale.startDatetime),
          endDatetime: this.toISO(flashSale.endDatetime),
          products: cleanProducts,
        },
        meta: { nowStr, timezone: 'Asia/Jakarta' },
      })
    } catch (e: any) {
      console.error(e)
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  // =========================
  // PROMO: SALE
  // - serve: active sale sekarang (1 item)
  // - list: semua sale published yang belum berakhir (buat page sale)
  // =========================
  public async getSale({ response }: HttpContext) {
    try {
      const { nowStr } = this.nowWib()

      const active = await Sale.query()
        .where('is_publish', 1 as any)
        .where('start_datetime', '<=', nowStr)
        .where('end_datetime', '>=', nowStr)
        .orderBy('start_datetime', 'desc')
        .preload('products', (q) => this.preloadPromoProducts(q, 'sale'))
        .first()

      const list = await Sale.query()
        .where('is_publish', 1 as any)
        .where('end_datetime', '>=', nowStr)
        .orderBy('start_datetime', 'asc')
        .preload('products', (q) => this.preloadPromoProducts(q, 'sale'))

      const svc = new DiscountPricingService()

      const mapSaleBase = (s: any) => {
        const products = this.mapPromoProducts(s.products, 'sale')
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          hasButton: s.hasButton,
          buttonText: s.buttonText,
          buttonUrl: s.buttonUrl,
          startDatetime: this.toISO(s.startDatetime),
          endDatetime: this.toISO(s.endDatetime),
          products,
        }
      }

      const serveObj = active ? mapSaleBase(active) : null
      if (serveObj?.products?.length) {
        await svc.attachExtraDiscount(serveObj.products as any[])
        serveObj.products = this.stripHelperFields(serveObj.products)
      }

      const listMapped = list.map(mapSaleBase)
      for (const it of listMapped) {
        if (it?.products?.length) {
          await svc.attachExtraDiscount(it.products as any[])
          it.products = this.stripHelperFields(it.products)
        }
      }

      return response.status(200).send({
        message: active ? 'Success' : 'No active sale',
        serve: serveObj,
        list: listMapped,
        meta: { nowStr, timezone: 'Asia/Jakarta' },
      })
    } catch (e: any) {
      console.error(e)
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  // =========================
  // PROMO: SALES LIST (optional endpoint)
  // GET /sales?include_expired=1&with_products=1
  // =========================
  public async getSales({ request, response }: HttpContext) {
    try {
      const { nowStr } = this.nowWib()
      const qs = request.qs()

      const includeExpired = qs.include_expired === '1' || qs.include_expired === 'true'
      const onlyWithProducts = qs.with_products !== '0' // default true

      const q = Sale.query().where('is_publish', 1 as any)
      if (!includeExpired) q.where('end_datetime', '>=', nowStr)

      if (onlyWithProducts) {
        // ✅ whereHas wajib pakai callback
        q.whereHas('products', () => {})
      }

      const rows = await q
        .orderBy('start_datetime', 'desc')
        .preload('products', (pq) => this.preloadPromoProducts(pq, 'sale'))

      const svc = new DiscountPricingService()

      const mapped = rows.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        hasButton: s.hasButton,
        buttonText: s.buttonText,
        buttonUrl: s.buttonUrl,
        startDatetime: this.toISO(s.startDatetime),
        endDatetime: this.toISO(s.endDatetime),
        products: this.mapPromoProducts(s.products, 'sale'),
      }))

      for (const it of mapped) {
        if (it?.products?.length) {
          await svc.attachExtraDiscount(it.products as any[])
          it.products = this.stripHelperFields(it.products)
        }
      }

      return response.status(200).send({
        message: 'Success',
        serve: mapped,
        meta: { nowStr, timezone: 'Asia/Jakarta', total: mapped.length },
      })
    } catch (e: any) {
      console.error(e)
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }
}
