import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import Setting from '#models/setting'
import { SettingType } from '../../enums/setting_types.js'
import Faq from '#models/faq'
import FlashSale from '#models/flashsale'
import { DateTime } from 'luxon'

export default class HomeController {
  private toISO(v: any): string | null {
    if (v && typeof v.toISO === 'function') return v.toISO()
    if (typeof v === 'string') return v
    return null
  }

  public async getBanner({ response }: HttpContext) {
    try {
      const banners = await Banner.query().apply((s) => s.active()).orderBy('order', 'asc')
      return response.status(200).send({ message: 'Success', serve: banners })
    } catch (e: any) {
      console.error(e)
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
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
      return response.status(500).send({ message: e.message || 'Internal Mont = 500', serve: null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getPrivacyPolicy({ response }: HttpContext) {
    try {
      const returnPrivacyPolicy = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.PRIVACY_POLICY)
        .first()

      return response.status(200).send({ message: 'Success', serve: returnPrivacyPolicy })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getContactSupport({ response }: HttpContext) {
    try {
      const returnContactSupport = await Setting.query()
        .select('key', 'value', 'createdAt', 'updatedAt')
        .where('key', SettingType.CONTACT_US)
        .first()

      return response.status(200).send({ message: 'Success', serve: returnContactSupport })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getFlashSale({ response }: HttpContext) {
    try {
      // ✅ WIB biar match sama waktu yg kamu set di CMS
      const now = DateTime.now().setZone('Asia/Jakarta')
      const nowStr = now.toFormat('yyyy-LL-dd HH:mm:ss')

      const flashSale = await FlashSale.query()
        // ✅ kalau boolean tinyint, ini paling aman:
        .where('is_publish', 1 as any)
        .where('start_datetime', '<=', nowStr)
        .where('end_datetime', '>=', nowStr)
        .orderBy('start_datetime', 'desc')
        .preload('products', (q) => {
          q.pivotColumns(['flash_price', 'stock'])

          // ✅ FIX: jangan orderBy('order') karena kolomnya gak ada
          // pilih salah satu:
          q.preload('medias', (mq) => mq.orderBy('id', 'asc')) // ✅ aman
          // q.preload('medias') // ✅ ini juga boleh

          q.preload('brand', (bq) => bq.select(['id', 'name', 'slug']))
          q.preload('categoryType', (cq) => cq.select(['id', 'name']))
        })
        .first()

      if (!flashSale) {
        return response.status(200).send({
          message: 'No active flash sale',
          serve: null,
          meta: { nowStr, timezone: 'Asia/Jakarta' }, // optional debug
        })
      }

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

          products: flashSale.products.map((p: any) => {
            const flashPrice = Number(p?.$extras?.pivot_flash_price ?? 0)
            const stock = Number(p?.$extras?.pivot_stock ?? 0)

            const image =
              Array.isArray(p?.medias) && p.medias.length > 0 ? p.medias[0].url : null

            return {
              id: p.id,
              name: p.name,
              slug: p.slug ?? null,
              path: p.path ?? null,
              price: p.basePrice,
              flashPrice,
              stock,
              image,
              brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
              categoryType: p.categoryType
                ? { id: p.categoryType.id, name: p.categoryType.name }
                : null,
            }
          }),
        },
      })
    } catch (e: any) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
