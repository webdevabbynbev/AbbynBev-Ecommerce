import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import emitter from '@adonisjs/core/services/emitter'
import { DateTime } from 'luxon'

import Discount from '#models/discount'
import DiscountTarget from '#models/discount_target'

function toInt(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function uniqNums(arr: any[]): number[] {
  return Array.from(new Set((arr ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x))))
}

function buildMaskFromDays(days: any[]): number {
  // CMS: ["0".."6"] => 0=Minggu bit=1, 1=Senin bit=2, dst
  const ds = uniqNums(days)
  let mask = 0
  for (const d of ds) {
    if (d === 0) mask |= 1
    else mask |= 1 << d
  }
  return mask || 127
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

function isValidId(id: any) {
  const n = Number(id)
  return Number.isFinite(n) && n > 0
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
        .if(q, (query) => {
          query.where((sub) => {
            sub.whereILike('name', `%${q}%`).orWhereILike('code', `%${q}%`)
          })
        })
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      const json = discounts.toJSON()

      // FE expects startedAt/expiredAt, qty, and numeric flags 1/0
      const data = (json.data ?? []).map((d: any) => {
        const startedDate = d.startedAt ? DateTime.fromISO(d.startedAt).toISODate() : null
        const expiredDate = d.expiredAt ? DateTime.fromISO(d.expiredAt).toISODate() : null

        return {
          ...d,
          startedAt: startedDate,
          expiredAt: expiredDate,
          started_at: startedDate,
          expired_at: expiredDate,

          // FE lama biasanya pakai 1/0
          isActive: d.isActive ? 1 : 0,
          is_active: d.isActive ? 1 : 0,
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
      if (!isValidId(params.id)) {
        return response.badRequest({ message: 'Invalid discount id', serve: null })
      }
      const id = Number(params.id)

      const discount = await Discount.query().where('id', id).whereNull('deleted_at').first()
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      const targets = await DiscountTarget.query().where('discount_id', discount.id)

      const categoryTypeIds = targets.filter((t: any) => t.targetType === 1).map((t: any) => t.targetId)

      // VARIANT: prefer target_type=5 (attribute_value_id), fallback target_type=2 (product_variant_id)
      const legacyVariantIds = targets.filter((t: any) => t.targetType === 2).map((t: any) => t.targetId)
      const attrValueIds = targets.filter((t: any) => t.targetType === 5).map((t: any) => t.targetId)
      const variantIds = attrValueIds.length ? attrValueIds : legacyVariantIds

      const brandIds = targets.filter((t: any) => t.targetType === 3).map((t: any) => t.targetId)
      const productIds = targets.filter((t: any) => t.targetType === 4).map((t: any) => t.targetId)

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

          isActive: discount.isActive ? 1 : 0,
          is_active: discount.isActive ? 1 : 0,
          isEcommerce: discount.isEcommerce ? 1 : 0,
          is_ecommerce: discount.isEcommerce ? 1 : 0,
          isPos: discount.isPos ? 1 : 0,
          is_pos: discount.isPos ? 1 : 0,

          categoryTypeIds,
          variantIds,
          brandIds,
          productIds,
          customerIds,

          qty: discount.usageLimit ?? null,
          daysOfWeek: daysFromMask(discount.daysOfWeekMask ?? 127),
          maxPerUser: null,
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

      const code = String(payload.code ?? '').trim()
      if (!code) return response.badRequest({ message: 'code wajib diisi', serve: null })

      const startedAt = parseStartDate(payload.started_at)
      if (!startedAt) return response.badRequest({ message: 'started_at wajib diisi', serve: null })

      const discount = new Discount()
      discount.useTransaction(trx)

      discount.name = payload.name ?? null
      discount.code = code
      discount.description = payload.description ?? null

      discount.valueType = toInt(payload.value_type, 1)
      discount.value = String(payload.value ?? '0')
      discount.maxDiscount = payload.max_discount ? String(payload.max_discount) : null

      discount.appliesTo = toInt(payload.applies_to, 0)
      discount.minOrderAmount = payload.min_order_amount ? String(payload.min_order_amount) : null
      discount.minOrderQty = payload.min_order_qty ? toInt(payload.min_order_qty) : null

      discount.eligibilityType = toInt(payload.eligibility_type, 0)

      const isUnlimited = toInt(payload.is_unlimited, 1)
      discount.usageLimit = isUnlimited === 1 ? null : payload.qty ? toInt(payload.qty) : null

      discount.isEcommerce = toInt(payload.is_ecommerce, 1) === 1
      discount.isPos = toInt(payload.is_pos, 0) === 1
      discount.isActive = toInt(payload.is_active, 1) === 1

      discount.startedAt = startedAt
      discount.expiredAt = payload.expired_at ? parseEndDate(payload.expired_at) : null
      discount.daysOfWeekMask = buildMaskFromDays(payload.days_of_week)

      await discount.save()

      // ----- targets -----
      const appliesTo = Number(discount.appliesTo)
      let targetType: number | null = null
      let targetIds: number[] = []

      // applies_to:
      // 2 = COLLECTION (target_type=1)
      // 3 = VARIANT (target_type=5 attribute_value_id)
      // 4 = BRAND (target_type=3)
      // 5 = PRODUCT (target_type=4)
      if (appliesTo === 2) {
        targetType = 1
        targetIds = uniqNums(payload.category_type_ids)
      } else if (appliesTo === 3) {
        targetType = 5
        targetIds = uniqNums(payload.variant_ids)
      } else if (appliesTo === 4) {
        targetType = 3
        targetIds = uniqNums(payload.brand_ids)
      } else if (appliesTo === 5) {
        targetType = 4
        targetIds = uniqNums(payload.product_ids)
      }

      if (targetType !== null && targetIds.length) {
        await DiscountTarget.createMany(
          targetIds.map((id) => ({ discountId: discount.id, targetType, targetId: id })),
          { client: trx }
        )
      }

      // ----- customer eligibility -----
      await trx.from('discount_customer_users').where('discount_id', discount.id).delete()
      if (Number(discount.eligibilityType) === 1) {
        const customerIds = uniqNums(payload.customer_ids)
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
      if (!isValidId(params.id)) {
        return response.badRequest({ message: 'Invalid discount id', serve: null })
      }
      const id = Number(params.id)

      const payload = request.all()

      const discount = await Discount.query({ client: trx }).where('id', id).whereNull('deleted_at').first()
      if (!discount) return response.status(404).send({ message: 'Discount not found', serve: null })

      const oldData = discount.toJSON()

      const code = String(payload.code ?? discount.code).trim()
      const startedAt = payload.started_at ? parseStartDate(payload.started_at) : discount.startedAt

      discount.name = payload.name ?? discount.name
      discount.code = code
      discount.description = payload.description ?? discount.description

      if (payload.value_type !== undefined) discount.valueType = toInt(payload.value_type, discount.valueType)
      if (payload.value !== undefined) discount.value = String(payload.value)
      discount.maxDiscount =
        payload.max_discount !== undefined ? (payload.max_discount ? String(payload.max_discount) : null) : discount.maxDiscount

      if (payload.applies_to !== undefined) discount.appliesTo = toInt(payload.applies_to, discount.appliesTo)
      discount.minOrderAmount =
        payload.min_order_amount !== undefined
          ? payload.min_order_amount
            ? String(payload.min_order_amount)
            : null
          : discount.minOrderAmount

      if (payload.min_order_qty !== undefined) {
        discount.minOrderQty = payload.min_order_qty ? toInt(payload.min_order_qty) : null
      }

      if (payload.eligibility_type !== undefined) {
        discount.eligibilityType = toInt(payload.eligibility_type, discount.eligibilityType)
      }

      const isUnlimited = toInt(payload.is_unlimited, discount.usageLimit === null ? 1 : 0)
      discount.usageLimit = isUnlimited === 1 ? null : payload.qty ? toInt(payload.qty) : null

      if (payload.is_ecommerce !== undefined) discount.isEcommerce = toInt(payload.is_ecommerce, discount.isEcommerce ? 1 : 0) === 1
      if (payload.is_pos !== undefined) discount.isPos = toInt(payload.is_pos, discount.isPos ? 1 : 0) === 1
      if (payload.is_active !== undefined) discount.isActive = toInt(payload.is_active, discount.isActive ? 1 : 0) === 1

      if (startedAt) discount.startedAt = startedAt
      discount.expiredAt =
        payload.expired_at !== undefined ? (payload.expired_at ? parseEndDate(payload.expired_at) : null) : discount.expiredAt
      discount.daysOfWeekMask =
        payload.days_of_week !== undefined ? buildMaskFromDays(payload.days_of_week) : discount.daysOfWeekMask

      await discount.save()

      // reset targets
      await DiscountTarget.query({ client: trx }).where('discount_id', discount.id).delete()

      const appliesTo = Number(discount.appliesTo)
      let targetType: number | null = null
      let targetIds: number[] = []

      if (appliesTo === 2) {
        targetType = 1
        targetIds = uniqNums(payload.category_type_ids)
      } else if (appliesTo === 3) {
        targetType = 5
        targetIds = uniqNums(payload.variant_ids)
      } else if (appliesTo === 4) {
        targetType = 3
        targetIds = uniqNums(payload.brand_ids)
      } else if (appliesTo === 5) {
        targetType = 4
        targetIds = uniqNums(payload.product_ids)
      }

      if (targetType !== null && targetIds.length) {
        await DiscountTarget.createMany(
          targetIds.map((id) => ({ discountId: discount.id, targetType, targetId: id })),
          { client: trx }
        )
      }

      // reset customers
      await trx.from('discount_customer_users').where('discount_id', discount.id).delete()
      if (Number(discount.eligibilityType) === 1) {
        const customerIds = uniqNums(payload.customer_ids)
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
      if (!isValidId(params.id)) {
        return response.badRequest({ message: 'Invalid discount id', serve: null })
      }
      const id = Number(params.id)

      const discount = await Discount.query({ client: trx }).where('id', id).whereNull('deleted_at').first()
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
      const idRaw = request.input('id')
      if (!isValidId(idRaw)) {
        return response.badRequest({ message: 'Invalid discount id', serve: null })
      }
      const id = Number(idRaw)

      // FE kirim 1/0
      const isActive = toInt(request.input('is_active'), 1) === 1

      const discount = await Discount.query({ client: trx }).where('id', id).whereNull('deleted_at').first()
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
