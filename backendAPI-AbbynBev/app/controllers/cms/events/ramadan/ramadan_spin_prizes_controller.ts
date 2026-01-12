import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import RamadanSpinPrize from '#models/ramadan_spin_prize'
import Voucher from '#models/voucher'

export default class RamadanSpinPrizesController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)

    const query = RamadanSpinPrize.query().orderBy('created_at', 'desc')
    const data = await query.paginate(page, perPage)

    return response.json(data)
  }

  public async store({ request, response }: HttpContext) {
    const payload = request.only([
      'name',
      'weight',
      'is_grand',
      'is_active',
      'daily_quota',
      'voucher_id',
      'voucher_qty',
    ])

    const name = String(payload.name || '').trim()

    if (!name) {
      return response.badRequest({ message: 'Nama hadiah wajib diisi.' })
    }

    const voucherId =
      payload.voucher_id !== undefined && payload.voucher_id !== null && payload.voucher_id !== ''
        ? Number(payload.voucher_id)
        : null

    const voucherQty = Number(payload.voucher_qty ?? 0)

    const dailyQuota =
      payload.daily_quota === undefined
        ? null
        : payload.daily_quota === null || payload.daily_quota === ''
          ? null
          : Number(payload.daily_quota)

    if (voucherId && voucherQty < 1) {
      return response.badRequest({ message: 'Jumlah voucher wajib diisi.' })
    }
    if (!voucherId && voucherQty > 0) {
      return response.badRequest({ message: 'Voucher belum dipilih.' })
    }

    try {
      const prize = await db.transaction(async (trx) => {
        if (voucherId) {
          const voucher = await Voucher.query({ client: trx })
            .where('id', voucherId)
            .forUpdate()
            .first()
          if (!voucher) {
            const error: any = new Error('Voucher tidak ditemukan.')
            error.httpStatus = 400
            throw error
          }

          if (Number(voucher.qty || 0) < voucherQty) {
            const error: any = new Error('Stok voucher tidak mencukupi.')
            error.httpStatus = 400
            throw error
          }

          voucher.qty = Math.max(0, Number(voucher.qty || 0) - voucherQty)
          await voucher.useTransaction(trx).save()
        }

        return RamadanSpinPrize.create(
          {
            name,
            weight: Number(payload.weight ?? 1),
            // NOTE: jangan pakai Boolean("0") => true
            isGrand:
              payload.is_grand === undefined
                ? false
                : payload.is_grand === true || payload.is_grand === 1 || payload.is_grand === '1',
            isActive:
              payload.is_active === undefined
                ? true
                : payload.is_active === true ||
                  payload.is_active === 1 ||
                  payload.is_active === '1',
            dailyQuota,
            voucherId: voucherId || null,
            voucherQty: voucherId ? voucherQty : 0,
          },
          { client: trx }
        )
      })

      return response.created({ message: 'Hadiah ditambahkan.', data: prize })
    } catch (error: any) {
      const status = error?.httpStatus || 500
      return response
        .status(status)
        .send({ message: error?.message || 'Gagal menambahkan hadiah.' })
    }
  }

  public async update({ request, response, params }: HttpContext) {
    const prize = await RamadanSpinPrize.find(params.id)
    if (!prize) return response.notFound({ message: 'Hadiah tidak ditemukan.' })

    // ✅ FIX: ambil field voucher_id, voucher_qty, daily_quota juga
    const payload = request.only([
      'name',
      'weight',
      'is_grand',
      'is_active',
      'daily_quota',
      'voucher_id',
      'voucher_qty',
    ])

    const name = payload.name !== undefined ? String(payload.name).trim() : prize.name

    const voucherId =
      payload.voucher_id !== undefined && payload.voucher_id !== null && payload.voucher_id !== ''
        ? Number(payload.voucher_id)
        : payload.voucher_id === null || payload.voucher_id === ''
          ? null
          : prize.voucherId

    const voucherQty =
      payload.voucher_qty !== undefined ? Number(payload.voucher_qty) : prize.voucherQty

    const dailyQuota =
      payload.daily_quota === undefined
        ? prize.dailyQuota
        : payload.daily_quota === null || payload.daily_quota === ''
          ? null
          : Number(payload.daily_quota)

    if (voucherId && voucherQty < 1) {
      return response.badRequest({ message: 'Jumlah voucher wajib diisi.' })
    }
    if (!voucherId && voucherQty > 0) {
      return response.badRequest({ message: 'Voucher belum dipilih.' })
    }

    try {
      await db.transaction(async (trx) => {
        // Kembalikan stok voucher lama kalau:
        // - voucher berubah, atau
        // - qty berkurang
        if (prize.voucherId) {
          const prevVoucher = await Voucher.query({ client: trx })
            .where('id', prize.voucherId)
            .forUpdate()
            .first()

          if (prevVoucher) {
            const shouldReturn = prize.voucherId !== voucherId || voucherQty < prize.voucherQty
            if (shouldReturn) {
              const diff =
                prize.voucherId !== voucherId ? prize.voucherQty : prize.voucherQty - voucherQty
              if (diff > 0) {
                prevVoucher.qty = Number(prevVoucher.qty || 0) + diff
                await prevVoucher.useTransaction(trx).save()
              }
            }
          }
        }

        // Ambil stok voucher baru kalau:
        // - voucher baru ada
        // - dan butuh tambahan qty
        if (voucherId) {
          const nextVoucher = await Voucher.query({ client: trx })
            .where('id', voucherId)
            .forUpdate()
            .first()

          if (!nextVoucher) {
            const error: any = new Error('Voucher tidak ditemukan.')
            error.httpStatus = 400
            throw error
          }

          const diff = prize.voucherId === voucherId ? voucherQty - prize.voucherQty : voucherQty
          if (diff > 0) {
            if (Number(nextVoucher.qty || 0) < diff) {
              const error: any = new Error('Stok voucher tidak mencukupi.')
              error.httpStatus = 400
              throw error
            }
            nextVoucher.qty = Math.max(0, Number(nextVoucher.qty || 0) - diff)
            await nextVoucher.useTransaction(trx).save()
          }
        }

        prize.name = name

        if (payload.weight !== undefined) prize.weight = Number(payload.weight)

        // NOTE: jangan pakai Boolean("0") => true
        if (payload.is_grand !== undefined) {
          prize.isGrand =
            payload.is_grand === true || payload.is_grand === 1 || payload.is_grand === '1'
        }

        if (payload.is_active !== undefined) {
          prize.isActive =
            payload.is_active === true || payload.is_active === 1 || payload.is_active === '1'
        }

        prize.dailyQuota = dailyQuota
        prize.voucherId = voucherId || null
        prize.voucherQty = voucherId ? voucherQty : 0

        await prize.useTransaction(trx).save()
      })

      return response.ok({ message: 'Hadiah diperbarui.', data: prize })
    } catch (error: any) {
      const status = error?.httpStatus || 500
      return response
        .status(status)
        .send({ message: error?.message || 'Gagal memperbarui hadiah.' })
    }
  }

  public async destroy({ params, response }: HttpContext) {
    const prize = await RamadanSpinPrize.find(params.id)
    if (!prize) return response.notFound({ message: 'Hadiah tidak ditemukan.' })

    await prize.delete()
    return response.ok({ message: 'Hadiah dihapus.' })
  }
}
