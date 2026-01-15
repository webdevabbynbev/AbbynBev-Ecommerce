import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

import Discount from '#models/discount'
import DiscountTarget from '#models/discount_target'

// =====================
// helpers
// =====================
function toInt(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toStr(v: any, fallback = '') {
  const s = String(v ?? '').trim()
  return s ? s : fallback
}

function pick(obj: any, ...keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined) return v
  }
  return undefined
}

function uniqNums(arr: any[]): number[] {
  return Array.from(new Set((arr ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x))))
}

// CMS days: ["0".."6"] => 0=Minggu
function buildMaskFromDays(days: any[]): number {
  const ds = uniqNums(days)
  let mask = 0
  for (const d of ds) {
    if (d === 0) mask |= 1
    else mask |= 1 << d
  }
  return mask || 127 // default semua hari
}

function daysFromMask(mask: number): number[] {
  const out: number[] = []
  const m = Number(mask || 127)
  for (let d = 0; d <= 6; d++) {
    const bit = d === 0 ? 1 : 1 << d
    if ((m & bit) === bit) out.push(d)
  }
  return out
}

// NOTE:
// Form kirim "YYYY-MM-DDTHH:mm" (tanpa TZ).
// Di controller ini kita pakai Asia/Jakarta lalu "dibulatkan" ke start/end day
// biar konsisten dengan tampilan periode di CMS (tanggal doang).
function parseStartDate(dateStr: any): DateTime | null {
  const s = String(dateStr ?? '').trim()
  if (!s) return null
  const dt = DateTime.fromISO(s, { zone: 'Asia/Jakarta' })
  return dt.isValid ? dt.startOf('day') : null
}

function parseEndDate(dateStr: any): DateTime | null {
  const s = String(dateStr ?? '').trim()
  if (!s) return null
  const dt = DateTime.fromISO(s, { zone: 'Asia/Jakarta' })
  return dt.isValid ? dt.endOf('day') : null
}

function normalizeIdentifier(raw: any): { id: number | null; code: string | null } {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return { id: null, code: null }
  const idNum = Number(trimmed)
  if (Number.isFinite(idNum) && idNum > 0) return { id: idNum, code: null }
  return { id: null, code: trimmed }
}

async function findDiscountByIdentifier(identifier: { id: number | null; code: string | null }, trx?: any) {
  if (identifier.id) {
    return Discount.query({ client: trx }).where('id', identifier.id).whereNull('deleted_at').first()
  }
  if (identifier.code) {
    return Discount.query({ client: trx }).where('code', identifier.code).whereNull('deleted_at').first()
  }
  return null
}

function toBoolFrom10(v: any, fallback = false) {
  if (v === undefined) return fallback
  return toInt(v, fallback ? 1 : 0) === 1
}

function toIsActive(v: any, fallback = true) {
  // CMS kamu pakai 1 = aktif, 2 = nonaktif
  if (v === undefined) return fallback
  return toInt(v, fallback ? 1 : 2) === 1
}

export default class DiscountsController {
  public async get({ response, request }: HttpContext) {
    try {
      const qs = request.qs()
      const q = String(qs.q ?? '').trim()
      const page = toInt(qs.page, 1) || 1
      const perPage = toInt(qs.per_page, 10) || 10

      const discounts = await Discount.query()
  .apply((scopes) => scopes.active())
  .select([
    'discounts.id',
    'discounts.name',
    'discounts.code',
    'discounts.value_type',
    'discounts.value',
    'discounts.max_discount',
    'discounts.applies_to',
    'discounts.min_order_amount',
    'discounts.usage_limit',
    'discounts.is_active',
    'discounts.is_ecommerce',
    'discounts.is_pos',
    'discounts.started_at',
    'discounts.expired_at',
    'discounts.created_at',
  ])
  .if(q, (query) => {
    query.where((sub) => {
      sub.whereILike('name', `%${q}%`).orWhereILike('code', `%${q}%`)
    })
  })
  .orderBy('created_at', 'desc')
  .paginate(page, perPage)


      const json = discounts.toJSON()

      const data = (json.data ?? []).map((d: any) => {
        const startedDate = d.startedAt ? DateTime.fromISO(d.startedAt).toISODate() : null
        const expiredDate = d.expiredAt ? DateTime.fromISO(d.expiredAt).toISODate() : null

        return {
          ...d,
          startedAt: startedDate,
          expiredAt: expiredDate,
          started_at: startedDate,
          expired_at: expiredDate,

          // FE lama kadang expect 1/0
          isActive: d.isActive ? 1 : 0,
          is_active: d.isActive ? 1 : 2, // biar nyambung sama CMS (1/2)
          isEcommerce: d.isEcommerce ? 1 : 0,
          is_ecommerce: d.isEcommerce ? 1 : 0,
          isPos: d.isPos ? 1 : 0,
          is_pos: d.isPos ? 1 : 0,

          qty: d.usageLimit ?? null,
        }
      })

      return response.ok({
        message: 'success',
        serve: { data, ...json.meta },
      })
    } catch (e: any) {
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async show({ response, params }: HttpContext) {
    try {
      const identifier = normalizeIdentifier(params.id)
      if (!identifier.id && !identifier.code) {
        return response.badRequest({ message: 'Invalid discount identifier', serve: null })
      }

      const discount = await findDiscountByIdentifier(identifier)
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      const targets = await DiscountTarget.query().where('discount_id', discount.id)

      const categoryTypeIds = targets.filter((t: any) => Number(t.targetType) === 1).map((t: any) => Number(t.targetId))
      const variantIds = targets.filter((t: any) => Number(t.targetType) === 2).map((t: any) => Number(t.targetId))

      const customerRows = await db.from('discount_customer_users').where('discount_id', discount.id).select('user_id')
      const customerIds = customerRows.map((r: any) => Number(r.user_id))

      const startedDate = discount.startedAt ? discount.startedAt.toISODate() : null
      const expiredDate = discount.expiredAt ? discount.expiredAt.toISODate() : null

      return response.ok({
        message: 'success',
        serve: {
          ...discount.toJSON(),

          startedAt: startedDate,
          expiredAt: expiredDate,
          started_at: startedDate,
          expired_at: expiredDate,

          // flags as 1/0 (dan 1/2 untuk is_active)
          isActive: discount.isActive ? 1 : 0,
          is_active: discount.isActive ? 1 : 2,
          isEcommerce: discount.isEcommerce ? 1 : 0,
          is_ecommerce: discount.isEcommerce ? 1 : 0,
          isPos: discount.isPos ? 1 : 0,
          is_pos: discount.isPos ? 1 : 0,

          categoryTypeIds,
          variantIds,
          category_type_ids: categoryTypeIds,
          variant_ids: variantIds,

          customerIds,
          customer_ids: customerIds,

          qty: discount.usageLimit ?? null,

          daysOfWeek: daysFromMask(discount.daysOfWeekMask ?? 127),
          days_of_week: daysFromMask(discount.daysOfWeekMask ?? 127).map(String),
        },
      })
    } catch (e: any) {
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const payload = request.all()

      const code = toStr(pick(payload, 'code'))
      if (!code) return response.badRequest({ message: 'code wajib diisi', serve: null })

      const startedAtRaw = pick(payload, 'started_at', 'startedAt')
      const startedAt = parseStartDate(startedAtRaw)
      if (!startedAt) return response.badRequest({ message: 'started_at wajib diisi', serve: null })

      const discount = new Discount()
      discount.useTransaction(trx)

      const name = String(pick(payload, 'name') ?? '').trim()
      discount.name = name ? name : null

      discount.code = code
      discount.description = (pick(payload, 'description') ?? null) ? String(pick(payload, 'description')) : null

      discount.valueType = toInt(pick(payload, 'value_type', 'valueType'), 1)
      discount.value = String(pick(payload, 'value') ?? '0')
      discount.maxDiscount = pick(payload, 'max_discount', 'maxDiscount') ? String(pick(payload, 'max_discount', 'maxDiscount')) : null

      discount.appliesTo = toInt(pick(payload, 'applies_to', 'appliesTo'), 0)
      discount.minOrderAmount = pick(payload, 'min_order_amount', 'minOrderAmount')
        ? String(pick(payload, 'min_order_amount', 'minOrderAmount'))
        : null

      // optional (kalau suatu saat dipakai)
      discount.minOrderQty = pick(payload, 'min_order_qty', 'minOrderQty') ? toInt(pick(payload, 'min_order_qty', 'minOrderQty')) : null

      discount.eligibilityType = toInt(pick(payload, 'eligibility_type', 'eligibilityType'), 0)

      const isUnlimited = toInt(pick(payload, 'is_unlimited', 'isUnlimited'), 1)
      const qty = pick(payload, 'qty')
      discount.usageLimit = isUnlimited === 1 ? null : qty ? toInt(qty) : null

      discount.isEcommerce = toInt(pick(payload, 'is_ecommerce', 'isEcommerce'), 1) === 1
      discount.isPos = toInt(pick(payload, 'is_pos', 'isPos'), 0) === 1
      discount.isActive = toIsActive(pick(payload, 'is_active', 'isActive'), true)

      // schedule
      discount.startedAt = startedAt

      const noExpiry = toInt(pick(payload, 'no_expiry', 'noExpiry'), 0) === 1
      const expiredRaw = pick(payload, 'expired_at', 'expiredAt')
      discount.expiredAt = noExpiry ? null : expiredRaw ? parseEndDate(expiredRaw) : null

      discount.daysOfWeekMask = buildMaskFromDays(pick(payload, 'days_of_week', 'daysOfWeek') ?? [])

      await discount.save()

      // =====================
      // targets (category / variant)
      // =====================
      await DiscountTarget.query({ client: trx }).where('discount_id', discount.id).delete()

      const appliesTo = Number(discount.appliesTo)
      if (appliesTo === 2) {
        // collection/category types
        const ids = uniqNums(pick(payload, 'category_type_ids', 'categoryTypeIds') ?? [])
        if (ids.length) {
          await DiscountTarget.createMany(
            ids.map((id) => ({ discountId: discount.id, targetType: 1, targetId: id })),
            { client: trx }
          )
        }
      } else if (appliesTo === 3) {
        // product variants (sesuai form kamu: variant_ids = product_variants.id)
        const ids = uniqNums(pick(payload, 'variant_ids', 'variantIds') ?? [])
        if (ids.length) {
          await DiscountTarget.createMany(
            ids.map((id) => ({ discountId: discount.id, targetType: 2, targetId: id })),
            { client: trx }
          )
        }
      }

      // =====================
      // customers eligibility
      // =====================
      await trx.from('discount_customer_users').where('discount_id', discount.id).delete()
      if (Number(discount.eligibilityType) === 1) {
        const customerIds = uniqNums(pick(payload, 'customer_ids', 'customerIds') ?? [])
        if (customerIds.length) {
          await trx
            .insertQuery()
            .table('discount_customer_users')
            .insert(customerIds.map((uid) => ({ discount_id: discount.id, user_id: uid })))
        }
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Discount ${discount.name ?? discount.code}`,
        menu: 'Discount',
        data: discount.toJSON(),
      })

      await trx.commit()
      return response.ok({ message: 'Successfully created.', serve: discount })
    } catch (e: any) {
      await trx.rollback()
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async update({ response, request, params, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const payload = request.all()

      const identifier = normalizeIdentifier(params.id)
      if (!identifier.id && !identifier.code) {
        return response.badRequest({ message: 'Invalid discount identifier', serve: null })
      }

      const discount = await findDiscountByIdentifier(identifier, trx)
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      const oldData = discount.toJSON()

      // basic
      if (pick(payload, 'name') !== undefined) {
        const nm = String(pick(payload, 'name') ?? '').trim()
        discount.name = nm ? nm : null
      }

      if (pick(payload, 'code') !== undefined) {
        const cd = toStr(pick(payload, 'code'))
        if (!cd) return response.badRequest({ message: 'code wajib diisi', serve: null })
        discount.code = cd
      }

      if (pick(payload, 'description') !== undefined) {
        const desc = pick(payload, 'description')
        discount.description = desc ? String(desc) : null
      }

      // value
      if (pick(payload, 'value_type', 'valueType') !== undefined) {
        discount.valueType = toInt(pick(payload, 'value_type', 'valueType'), discount.valueType)
      }
      if (pick(payload, 'value') !== undefined) {
        discount.value = String(pick(payload, 'value') ?? '0')
      }
      if (pick(payload, 'max_discount', 'maxDiscount') !== undefined) {
        const md = pick(payload, 'max_discount', 'maxDiscount')
        discount.maxDiscount = md ? String(md) : null
      }

      // conditions
      if (pick(payload, 'applies_to', 'appliesTo') !== undefined) {
        discount.appliesTo = toInt(pick(payload, 'applies_to', 'appliesTo'), discount.appliesTo)
      }
      if (pick(payload, 'min_order_amount', 'minOrderAmount') !== undefined) {
        const moa = pick(payload, 'min_order_amount', 'minOrderAmount')
        discount.minOrderAmount = moa ? String(moa) : null
      }

      if (pick(payload, 'eligibility_type', 'eligibilityType') !== undefined) {
        discount.eligibilityType = toInt(pick(payload, 'eligibility_type', 'eligibilityType'), discount.eligibilityType)
      }

      // usage limit
      const isUnlimited = toInt(pick(payload, 'is_unlimited', 'isUnlimited'), discount.usageLimit === null ? 1 : 0)
      const qty = pick(payload, 'qty')
      discount.usageLimit = isUnlimited === 1 ? null : qty ? toInt(qty) : null

      // channels + status
      if (pick(payload, 'is_ecommerce', 'isEcommerce') !== undefined) {
        discount.isEcommerce = toInt(pick(payload, 'is_ecommerce', 'isEcommerce'), discount.isEcommerce ? 1 : 0) === 1
      }
      if (pick(payload, 'is_pos', 'isPos') !== undefined) {
        discount.isPos = toInt(pick(payload, 'is_pos', 'isPos'), discount.isPos ? 1 : 0) === 1
      }
      if (pick(payload, 'is_active', 'isActive') !== undefined) {
        discount.isActive = toIsActive(pick(payload, 'is_active', 'isActive'), discount.isActive)
      }

      // schedule
      if (pick(payload, 'started_at', 'startedAt') !== undefined) {
        const st = parseStartDate(pick(payload, 'started_at', 'startedAt'))
        if (!st) return response.badRequest({ message: 'started_at wajib diisi', serve: null })
        discount.startedAt = st
      }

      if (pick(payload, 'days_of_week', 'daysOfWeek') !== undefined) {
        discount.daysOfWeekMask = buildMaskFromDays(pick(payload, 'days_of_week', 'daysOfWeek') ?? [])
      }

      // expiry
      const noExpiry = toInt(pick(payload, 'no_expiry', 'noExpiry'), discount.expiredAt ? 0 : 1) === 1
      if (noExpiry) {
        discount.expiredAt = null
      } else if (pick(payload, 'expired_at', 'expiredAt') !== undefined) {
        const ex = pick(payload, 'expired_at', 'expiredAt')
        discount.expiredAt = ex ? parseEndDate(ex) : null
      }

      await discount.save()

      // =====================
      // reset targets
      // =====================
      await DiscountTarget.query({ client: trx }).where('discount_id', discount.id).delete()

      const appliesTo = Number(discount.appliesTo)
      if (appliesTo === 2) {
        const ids = uniqNums(pick(payload, 'category_type_ids', 'categoryTypeIds') ?? [])
        if (ids.length) {
          await DiscountTarget.createMany(
            ids.map((id) => ({ discountId: discount.id, targetType: 1, targetId: id })),
            { client: trx }
          )
        }
      } else if (appliesTo === 3) {
        const ids = uniqNums(pick(payload, 'variant_ids', 'variantIds') ?? [])
        if (ids.length) {
          await DiscountTarget.createMany(
            ids.map((id) => ({ discountId: discount.id, targetType: 2, targetId: id })),
            { client: trx }
          )
        }
      }

      // =====================
      // reset customers
      // =====================
      await trx.from('discount_customer_users').where('discount_id', discount.id).delete()
      if (Number(discount.eligibilityType) === 1) {
        const customerIds = uniqNums(pick(payload, 'customer_ids', 'customerIds') ?? [])
        if (customerIds.length) {
          await trx
            .insertQuery()
            .table('discount_customer_users')
            .insert(customerIds.map((uid) => ({ discount_id: discount.id, user_id: uid })))
        }
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Discount ${oldData.name ?? oldData.code}`,
        menu: 'Discount',
        data: { old: oldData, new: discount.toJSON() },
      })

      await trx.commit()
      return response.ok({ message: 'Successfully updated.', serve: discount })
    } catch (e: any) {
      await trx.rollback()
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async delete({ response, params, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const identifier = normalizeIdentifier(params.id)
      if (!identifier.id && !identifier.code) {
        return response.badRequest({ message: 'Invalid discount identifier', serve: null })
      }

      const discount = await findDiscountByIdentifier(identifier, trx)
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      discount.useTransaction(trx)
      discount.deletedAt = DateTime.now()
      await discount.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Discount ${discount.name ?? discount.code}`,
        menu: 'Discount',
        data: discount.toJSON(),
      })

      await trx.commit()
      return response.ok({ message: 'Successfully deleted.', serve: true })
    } catch (e: any) {
      await trx.rollback()
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async updateStatus({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const identifier = normalizeIdentifier(request.input('id'))
      if (!identifier.id && !identifier.code) {
        return response.badRequest({ message: 'Invalid discount identifier', serve: null })
      }

      // FE bisa kirim 1/0 atau 1/2, kita anggap 1 = aktif
      const isActive = toIsActive(request.input('is_active'), true)

      const discount = await findDiscountByIdentifier(identifier, trx)
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      discount.isActive = isActive
      await discount.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Status Discount ${discount.name ?? discount.code}`,
        menu: 'Discount',
        data: discount.toJSON(),
      })

      await trx.commit()
      return response.ok({ message: 'Successfully updated.', serve: discount })
    } catch (e: any) {
      await trx.rollback()
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }
}
