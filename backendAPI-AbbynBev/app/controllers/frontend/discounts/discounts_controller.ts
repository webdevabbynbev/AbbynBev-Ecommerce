import type { HttpContext } from '@adonisjs/core/http'
import TransactionCart from '#models/transaction_cart'
import { DiscountEngineService } from '#services/discount/discount_engine_service'

export default class DiscountsController {
  private engine = new DiscountEngineService()

  public async validate({ auth, request, response }: HttpContext) {
    try {
      const code = String(request.input('code') ?? '').trim()
      if (!code) return response.badRequest({ message: 'Kode diskon wajib diisi' })

      // route ini wajib auth, jadi aman pakai !
      const userId = auth.user!.id

      const carts = await TransactionCart.query().where('user_id', userId)

      const result = await this.engine.validateByCode({
        code,
        userId,
        channel: 'ecommerce',
        carts,
      })

      return response.ok({
        message: 'Diskon valid',
        serve: {
          discount_id: result.discount.id,
          code: result.discount.code,
          eligible_subtotal: result.eligibleSubtotal,
          discount_amount: result.discountAmount,
        },
      })
    } catch (e: any) {
      const err = String(e?.message ?? e)
      const map: Record<string, string> = {
        DISCOUNT_NOT_FOUND: 'Kode diskon tidak ditemukan',
        DISCOUNT_INACTIVE: 'Diskon tidak aktif',
        DISCOUNT_NOT_ALLOWED_CHANNEL: 'Diskon tidak bisa dipakai di channel ini',
        DISCOUNT_NOT_IN_SCHEDULE: 'Diskon tidak berlaku pada waktu/hari ini',
        DISCOUNT_LIMIT_REACHED: 'Kuota diskon sudah habis',
        DISCOUNT_MIN_ORDER_NOT_MET: 'Syarat minimum pesanan belum terpenuhi',
        DISCOUNT_NOT_ELIGIBLE: 'Diskon tidak berlaku untuk item/pesanan ini',
        DISCOUNT_ZERO: 'Diskon tidak bisa diterapkan',
        DISCOUNT_ELIGIBILITY_NOT_IMPLEMENTED: 'Rule pelanggan belum diaktifkan (sementara)',
      }
      return response.badRequest({ message: map[err] ?? 'Gagal validasi diskon' })
    }
  }
}
