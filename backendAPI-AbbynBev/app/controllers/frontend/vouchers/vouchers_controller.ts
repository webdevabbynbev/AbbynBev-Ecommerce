import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Voucher from '#models/voucher'
import VoucherClaim, { VoucherClaimStatus } from '#models/voucher_claim'

function nowWibSql() {
  return DateTime.now().setZone('Asia/Jakarta').toFormat('yyyy-LL-dd HH:mm:ss')
}

export default class VouchersController {
  /**
   * Voucher yang bisa diklaim user (qty>0, active, tanggal valid, belum diklaim user)
   */
  public async available({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const dateString = nowWibSql()

      const vouchers = await Voucher.query()
        .apply((q) => q.active())
        .where('is_active', 1)
        .where('qty', '>', 0)
        .where((q) => q.whereNull('started_at').orWhere('started_at', '<=', dateString))
        .where((q) => q.whereNull('expired_at').orWhere('expired_at', '>=', dateString))
        .whereNotExists((sub) => {
          sub
            .from('voucher_claims')
            .whereRaw('voucher_claims.voucher_id = vouchers.id')
            .where('voucher_claims.user_id', user.id)
        })
        .orderBy('id', 'desc')

      return response.status(200).send({ message: 'success', serve: vouchers })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  /**
   * Voucher yang sudah diklaim user
   * ?status=claimed|reserved|used (optional)
   */
  public async my({ response, auth, request }: HttpContext) {
    try {
      const user = auth.user
      if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

      const status = String(request.qs().status || '').toLowerCase()
      const statusMap: Record<string, number> = {
        claimed: VoucherClaimStatus.CLAIMED,
        reserved: VoucherClaimStatus.RESERVED,
        used: VoucherClaimStatus.USED,
      }

      const q = VoucherClaim.query()
        .where('user_id', user.id)
        .preload('voucher')
        .orderBy('claimed_at', 'desc')

      if (status && status in statusMap) q.where('status', statusMap[status])

      const claims = await q

      const serve = claims
        .filter((c) => !!c.voucher)
        .map((c) => ({
          ...c.voucher.toJSON(),
          claim_id: c.id,
          claim_status: c.status,
          claimed_at: c.claimedAt,
          reserved_at: c.reservedAt,
          used_at: c.usedAt,
          transaction_id: c.transactionId,
        }))

      return response.status(200).send({ message: 'success', serve })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  /**
   * Claim voucher: qty berkurang saat claim
   */
  public async claim({ response, auth, params }: HttpContext) {
    const user = auth.user
    if (!user) return response.status(401).send({ message: 'Unauthorized', serve: null })

    const voucherId = Number(params.id)
    if (!voucherId) return response.status(400).send({ message: 'voucher id invalid', serve: null })

    try {
      const result = await db.transaction(async (trx) => {
        const dateString = nowWibSql()

        const voucher = await Voucher.query({ client: trx })
          .apply((q) => q.active())
          .where('id', voucherId)
          .where('is_active', 1)
          .where('qty', '>', 0)
          .where((q) => q.whereNull('started_at').orWhere('started_at', '<=', dateString))
          .where((q) => q.whereNull('expired_at').orWhere('expired_at', '>=', dateString))
          .forUpdate()
          .first()

        if (!voucher) {
          const err: any = new Error('Voucher not available.')
          err.httpStatus = 400
          throw err
        }

        const already = await VoucherClaim.query({ client: trx })
          .where('voucher_id', voucherId)
          .where('user_id', user.id)
          .first()

        if (already) {
          const err: any = new Error('Voucher already claimed.')
          err.httpStatus = 400
          throw err
        }

        voucher.qty = Math.max(0, Number(voucher.qty || 0) - 1)
        await voucher.useTransaction(trx).save()

        const claim = new VoucherClaim()
        claim.voucherId = voucherId
        claim.userId = user.id
        claim.status = VoucherClaimStatus.CLAIMED
        claim.claimedAt = DateTime.now().setZone('Asia/Jakarta')
        claim.transactionId = null
        claim.reservedAt = null
        claim.usedAt = null
        await claim.useTransaction(trx).save()

        return { voucher, claim }
      })

      return response.status(200).send({
        message: 'Voucher claimed.',
        serve: {
          voucher: result.voucher,
          claim: result.claim,
        },
      })
    } catch (e: any) {
      const status = e.httpStatus || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  /**
   * Validate code (legacy, boleh keep)
   */
  public async validate({ response, request }: HttpContext) {
    try {
      const dateString = nowWibSql()

      const vouchers = await Voucher.query()
        .apply((query) => query.active())
        .where('code', request.input('code'))
        .where('is_active', 1)
        .where('qty', '>', 0)
        .where((q) => q.whereNull('started_at').orWhere('started_at', '<=', dateString))
        .where((q) => q.whereNull('expired_at').orWhere('expired_at', '>=', dateString))
        .first()

      if (!vouchers) {
        return response.status(400).send({ message: 'Voucher not valid.', serve: null })
      }

      return response.status(200).send({ message: '', serve: vouchers })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }
}
