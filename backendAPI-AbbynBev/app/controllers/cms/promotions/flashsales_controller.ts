import type { HttpContext } from '@adonisjs/core/http'
import FlashSale from '#models/flashsale'
import FlashSaleProduct from '#models/flashsale_product'
import Discount from '#models/discount'
import { createFlashSaleValidator, updateFlashSaleValidator } from '#validators/flashsale'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'
import { PromoFlagService } from '#services/promo/promo_flag_service'

// =====================
// helpers (discount conflict)
// =====================
function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function uniqPositiveInts(arr: any[]): number[] {
  return Array.from(
    new Set((arr ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0))
  )
}

function weekdayBit(dt: DateTime) {
  // Luxon: weekday 1=Mon ... 7=Sun
  return dt.weekday === 7 ? 1 : 1 << dt.weekday
}

function doesDiscountOverlapPromo(discount: Discount, promoStart: DateTime, promoEnd: DateTime) {
  // Treat null start/end as open interval
  const dStart = discount.startedAt ? discount.startedAt.setZone('Asia/Jakarta') : DateTime.fromMillis(0).setZone('Asia/Jakarta')
  const dEnd = discount.expiredAt ? discount.expiredAt.setZone('Asia/Jakarta') : DateTime.fromISO('9999-12-31T23:59:59', { zone: 'Asia/Jakarta' })

  const start = promoStart > dStart ? promoStart : dStart
  const end = promoEnd < dEnd ? promoEnd : dEnd
  if (start > end) return false

  const mask = Number(discount.daysOfWeekMask ?? 127) || 127

  const startDay = start.startOf('day')
  const endDay = end.startOf('day')

  const diffDays = Math.floor(endDay.diff(startDay, 'days').days)

  // Any consecutive 7 days will contain all weekdays.
  if (diffDays >= 6) {
    return mask !== 0
  }

  for (let i = 0; i <= diffDays; i++) {
    const day = startDay.plus({ days: i })
    const bit = weekdayBit(day)
    if ((mask & bit) === bit) return true
  }
  return false
}

function isUsageAvailable(discount: Discount) {
  if (discount.usageLimit === null) return true
  const used = toNumber(discount.usageCount, 0)
  const reserved = toNumber(discount.reservedCount, 0)
  return used + reserved < toNumber(discount.usageLimit, 0)
}

async function findDiscountConflictsForProducts(
  trx: any,
  productIds: number[],
  promoStart: DateTime,
  promoEnd: DateTime
): Promise<{ productIds: number[]; discountIds: number[] }> {
  const ids = uniqPositiveInts(productIds)
  if (!ids.length) return { productIds: [], discountIds: [] }

  const schema = (db as any).connection().schema as any
  const hasDiscountTargets = await schema.hasTable('discount_targets')
  if (!hasDiscountTargets) return { productIds: [], discountIds: [] }

  // Pull candidate auto discounts (only those that target products/brand/category/variant)
  const discounts = await Discount.query({ client: trx })
    .whereNull('deleted_at')
    .where('is_active', 1 as any)
    .where('is_ecommerce', 1 as any)
    .where('eligibility_type', 0 as any)
    .where('is_auto', 1 as any)
    .whereIn('applies_to', [2, 3, 4, 5])
    .orderBy('id', 'desc')

  const promoStartWib = promoStart.setZone('Asia/Jakarta')
  const promoEndWib = promoEnd.setZone('Asia/Jakarta')

  const activeIds = discounts
    .filter((d) => isUsageAvailable(d) && doesDiscountOverlapPromo(d, promoStartWib, promoEndWib))
    .map((d) => Number(d.id))
    .filter((x) => Number.isFinite(x) && x > 0)

  if (!activeIds.length) return { productIds: [], discountIds: [] }

  const discounted = new Set<number>()
  const hitDiscountIds = new Set<number>()

  // 4 = product_id
  const rowsProduct = await trx
    .from('discount_targets as dt')
    .whereIn('dt.discount_id', activeIds)
    .where('dt.target_type', 4)
    .whereIn('dt.target_id', ids)
    .select('dt.discount_id as discount_id', 'dt.target_id as product_id')

  for (const r of rowsProduct as any[]) {
    const pid = toNumber(r.product_id, 0)
    const did = toNumber(r.discount_id, 0)
    if (pid) discounted.add(pid)
    if (did) hitDiscountIds.add(did)
  }

  // 1 = category_type_id
  const rowsCategory = await trx
    .from('discount_targets as dt')
    .join('products as p', 'p.category_type_id', 'dt.target_id')
    .whereIn('dt.discount_id', activeIds)
    .where('dt.target_type', 1)
    .whereIn('p.id', ids)
    .whereNull('p.deleted_at')
    .select('dt.discount_id as discount_id', 'p.id as product_id')

  for (const r of rowsCategory as any[]) {
    const pid = toNumber(r.product_id, 0)
    const did = toNumber(r.discount_id, 0)
    if (pid) discounted.add(pid)
    if (did) hitDiscountIds.add(did)
  }

  // 3 = brand_id
  // (assume products.brand_id exists in your schema)
  const rowsBrand = await trx
    .from('discount_targets as dt')
    .join('products as p', 'p.brand_id', 'dt.target_id')
    .whereIn('dt.discount_id', activeIds)
    .where('dt.target_type', 3)
    .whereIn('p.id', ids)
    .whereNull('p.deleted_at')
    .select('dt.discount_id as discount_id', 'p.id as product_id')

  for (const r of rowsBrand as any[]) {
    const pid = toNumber(r.product_id, 0)
    const did = toNumber(r.discount_id, 0)
    if (pid) discounted.add(pid)
    if (did) hitDiscountIds.add(did)
  }

  // 2 = product_variants.id (legacy)
  const hasProductVariants = await schema.hasTable('product_variants')
  if (hasProductVariants) {
    const rowsLegacyVariant = await trx
      .from('discount_targets as dt')
      .join('product_variants as pv', 'pv.id', 'dt.target_id')
      .whereIn('dt.discount_id', activeIds)
      .where('dt.target_type', 2)
      .whereIn('pv.product_id', ids)
      .whereNull('pv.deleted_at')
      .select('dt.discount_id as discount_id', 'pv.product_id as product_id')

    for (const r of rowsLegacyVariant as any[]) {
      const pid = toNumber(r.product_id, 0)
      const did = toNumber(r.discount_id, 0)
      if (pid) discounted.add(pid)
      if (did) hitDiscountIds.add(did)
    }
  }

  // 5 = attribute_value_id (via variant_attributes)
  const hasVariantAttributes = await schema.hasTable('variant_attributes')
  if (hasVariantAttributes && hasProductVariants) {
    const rowsAttrVariant = await trx
      .from('discount_targets as dt')
      .join('variant_attributes as va', 'va.attribute_value_id', 'dt.target_id')
      .join('product_variants as pv', 'pv.id', 'va.product_variant_id')
      .whereIn('dt.discount_id', activeIds)
      .where('dt.target_type', 5)
      .whereIn('pv.product_id', ids)
      .whereNull('va.deleted_at')
      .whereNull('pv.deleted_at')
      .select('dt.discount_id as discount_id', 'pv.product_id as product_id')

    for (const r of rowsAttrVariant as any[]) {
      const pid = toNumber(r.product_id, 0)
      const did = toNumber(r.discount_id, 0)
      if (pid) discounted.add(pid)
      if (did) hitDiscountIds.add(did)
    }
  }

  return {
    productIds: Array.from(discounted),
    discountIds: Array.from(hitDiscountIds),
  }
}

export default class FlashsalesController {
  private promoFlag = new PromoFlagService()

  public async get({ response }: HttpContext) {
    const flashSales = await FlashSale.query()
      .preload('products', (q) => {
        q.pivotColumns(['flash_price', 'stock'])
      })
      .orderBy('start_datetime', 'desc')

    return response.status(200).send({
      message: 'Success',
      serve: flashSales,
    })
  }

  public async show({ params, response }: HttpContext) {
    const flashSale = await FlashSale.query()
      .where('id', params.id)
      .preload('products', (q) => {
        q.pivotColumns(['flash_price', 'stock'])
      })
      .first()

    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: flashSale,
    })
  }

  public async create({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createFlashSaleValidator)
    const trx = await db.transaction()

    try {
      const promoStart = DateTime.fromJSDate(payload.start_datetime).setZone('Asia/Jakarta')
      const promoEnd = DateTime.fromJSDate(payload.end_datetime).setZone('Asia/Jakarta')
      const willBePublished = payload.is_publish ?? true

      const requestedProductIds = uniqPositiveInts((payload.products || []).map((p) => p.product_id))

      // ✅ BLOCK: produk yg kena Discount (auto) overlap periode promo tidak boleh masuk Flash Sale
      if (willBePublished && requestedProductIds.length) {
        const conflicts = await findDiscountConflictsForProducts(trx, requestedProductIds, promoStart, promoEnd)
        if (conflicts.productIds.length) {
          await trx.rollback()
          return response.status(409).send({
            message: 'Produk sedang ikut Discount (auto) pada periode tersebut. Tidak bisa dimasukkan ke Flash Sale.',
            serve: {
              code: 'DISCOUNT_CONFLICT',
              productIds: conflicts.productIds,
              discountIds: conflicts.discountIds,
            },
          })
        }
      }

      const flashSale = await FlashSale.create(
        {
          title: payload.title,
          description: payload.description,
          hasButton: payload.has_button,
          buttonText: payload.button_text,
          buttonUrl: payload.button_url,
          startDatetime: DateTime.fromJSDate(payload.start_datetime),
          endDatetime: DateTime.fromJSDate(payload.end_datetime),
          isPublish: payload.is_publish,
          createdBy: auth.user?.id,
          updatedBy: auth.user?.id,
        },
        { client: trx }
      )

      const productIds: number[] = []

      if (payload.products?.length) {
        for (const p of payload.products) {
          productIds.push(Number(p.product_id))
          await FlashSaleProduct.create(
            {
              flashSaleId: flashSale.id,
              productId: p.product_id,
              flashPrice: p.flash_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      // ✅ sync flag is_flash_sale untuk produk yg di-assign flash sale
      if (productIds.length) {
        await this.promoFlag.syncFlashSaleFlags(productIds, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Flash Sale ${flashSale.title}`,
        menu: 'Flash Sale',
        data: flashSale.toJSON(),
      })

      return response.status(201).send({
        message: 'Flash Sale created successfully',
        serve: flashSale,
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateFlashSaleValidator)

    const flashSale = await FlashSale.find(params.id)
    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = flashSale.toJSON()

      const oldRows = await db
        .from('flashsale_products')
        .useTransaction(trx)
        .where('flash_sale_id', flashSale.id)
        .select('product_id')

      const oldIds = uniqPositiveInts(oldRows.map((r: any) => r.product_id))

      // decide new state (publish + schedule + products)
      const newStart = payload.start_datetime
        ? DateTime.fromJSDate(payload.start_datetime)
        : flashSale.startDatetime
      const newEnd = payload.end_datetime ? DateTime.fromJSDate(payload.end_datetime) : flashSale.endDatetime
      const willBePublished = payload.is_publish ?? flashSale.isPublish

      const productsProvided = payload.products !== undefined
      const newIds = productsProvided
        ? uniqPositiveInts((payload.products || []).map((p) => p.product_id))
        : oldIds

      // ✅ BLOCK: produk yg kena Discount (auto) overlap periode promo tidak boleh ada di Flash Sale
      if (willBePublished && newIds.length) {
        const promoStart = newStart.setZone('Asia/Jakarta')
        const promoEnd = newEnd.setZone('Asia/Jakarta')

        const conflicts = await findDiscountConflictsForProducts(trx, newIds, promoStart, promoEnd)
        if (conflicts.productIds.length) {
          await trx.rollback()
          return response.status(409).send({
            message: 'Produk sedang ikut Discount (auto) pada periode tersebut. Tidak bisa dimasukkan ke Flash Sale.',
            serve: {
              code: 'DISCOUNT_CONFLICT',
              productIds: conflicts.productIds,
              discountIds: conflicts.discountIds,
            },
          })
        }
      }

      flashSale.merge({
        title: payload.title ?? flashSale.title,
        description: payload.description ?? flashSale.description,
        hasButton: payload.has_button ?? flashSale.hasButton,
        buttonText: payload.button_text ?? flashSale.buttonText,
        buttonUrl: payload.button_url ?? flashSale.buttonUrl,
        startDatetime: payload.start_datetime ? DateTime.fromJSDate(payload.start_datetime) : flashSale.startDatetime,
        endDatetime: payload.end_datetime ? DateTime.fromJSDate(payload.end_datetime) : flashSale.endDatetime,
        isPublish: payload.is_publish ?? flashSale.isPublish,
        updatedBy: auth.user?.id,
      })

      await flashSale.useTransaction(trx).save()

      // ✅ kalau products dikirim (meskipun []), berarti replace pivot
      let finalIds: number[] = oldIds

      if (productsProvided) {
        await FlashSaleProduct.query({ client: trx }).where('flash_sale_id', flashSale.id).delete()

        finalIds = []
        for (const p of payload.products || []) {
          finalIds.push(Number(p.product_id))
          await FlashSaleProduct.create(
            {
              flashSaleId: flashSale.id,
              productId: p.product_id,
              flashPrice: p.flash_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      // ✅ sync flag:
      // union old+new supaya yg dilepas ikut di-reset
      const affectedIds = Array.from(new Set([...(oldIds || []), ...(finalIds || [])])).filter(Boolean)

      if (affectedIds.length) {
        await this.promoFlag.syncFlashSaleFlags(affectedIds, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Flash Sale ${oldData.title}`,
        menu: 'Flash Sale',
        data: { old: oldData, new: flashSale.toJSON() },
      })

      return response.status(200).send({
        message: 'Flash Sale updated successfully',
        serve: flashSale,
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async delete({ params, response, auth }: HttpContext) {
    const flashSale = await FlashSale.find(params.id)
    if (!flashSale) {
      return response.status(404).send({
        message: 'Flash Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = flashSale.toJSON()

      const rows = await db
        .from('flashsale_products')
        .useTransaction(trx)
        .where('flash_sale_id', flashSale.id)
        .select('product_id')

      const ids = uniqPositiveInts(rows.map((r: any) => r.product_id))

      await FlashSaleProduct.query({ client: trx }).where('flash_sale_id', flashSale.id).delete()
      await flashSale.useTransaction(trx).delete()

      if (ids.length) {
        await this.promoFlag.syncFlashSaleFlags(ids, trx)
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Flash Sale ${oldData.title}`,
        menu: 'Flash Sale',
        data: oldData,
      })

      return response.status(200).send({
        message: 'Flash Sale deleted successfully',
        serve: true,
      })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
