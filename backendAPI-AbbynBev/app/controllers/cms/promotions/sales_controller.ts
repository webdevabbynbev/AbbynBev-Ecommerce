import type { HttpContext } from '@adonisjs/core/http'
import Sale from '#models/sale'
import SaleProduct from '#models/sale_product'
import Discount from '#models/discount'
import { createSaleValidator, updateSaleValidator } from '#validators/sale'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import emitter from '@adonisjs/core/services/emitter'

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
  const dStart = discount.startedAt ? discount.startedAt.setZone('Asia/Jakarta') : DateTime.fromMillis(0).setZone('Asia/Jakarta')
  const dEnd = discount.expiredAt ? discount.expiredAt.setZone('Asia/Jakarta') : DateTime.fromISO('9999-12-31T23:59:59', { zone: 'Asia/Jakarta' })

  const start = promoStart > dStart ? promoStart : dStart
  const end = promoEnd < dEnd ? promoEnd : dEnd
  if (start > end) return false

  const mask = Number(discount.daysOfWeekMask ?? 127) || 127

  const startDay = start.startOf('day')
  const endDay = end.startOf('day')
  const diffDays = Math.floor(endDay.diff(startDay, 'days').days)

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

export default class SalesController {
  public async get({ response }: HttpContext) {
    const sales = await Sale.query()
      .preload('products', (q) => {
        q.pivotColumns(['sale_price', 'stock'])
      })
      .orderBy('start_datetime', 'desc')

    return response.status(200).send({
      message: 'Success',
      serve: sales,
    })
  }

  public async show({ params, response }: HttpContext) {
    const sale = await Sale.query()
      .where('id', params.id)
      .preload('products', (q) => {
        q.pivotColumns(['sale_price', 'stock'])
      })
      .first()

    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: sale,
    })
  }

  public async create({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createSaleValidator)
    const trx = await db.transaction()

    try {
      const promoStart = DateTime.fromJSDate(payload.start_datetime).setZone('Asia/Jakarta')
      const promoEnd = DateTime.fromJSDate(payload.end_datetime).setZone('Asia/Jakarta')
      const willBePublished = payload.is_publish ?? false

      const requestedProductIds = uniqPositiveInts((payload.products || []).map((p) => p.product_id))

      // ✅ BLOCK: produk yg kena Discount (auto) overlap periode promo tidak boleh masuk Sale
      if (willBePublished && requestedProductIds.length) {
        const conflicts = await findDiscountConflictsForProducts(trx, requestedProductIds, promoStart, promoEnd)
        if (conflicts.productIds.length) {
          await trx.rollback()
          return response.status(409).send({
            message: 'Produk sedang ikut Discount (auto) pada periode tersebut. Tidak bisa dimasukkan ke Sale.',
            serve: {
              code: 'DISCOUNT_CONFLICT',
              productIds: conflicts.productIds,
              discountIds: conflicts.discountIds,
            },
          })
        }
      }

      const sale = await Sale.create(
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

      if (payload.products?.length) {
        for (const p of payload.products) {
          await SaleProduct.create(
            {
              saleId: sale.id,
              productId: p.product_id,
              salePrice: p.sale_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Sale ${sale.title}`,
        menu: 'Sale',
        data: sale.toJSON(),
      })

      return response.status(201).send({
        message: 'Sale created successfully',
        serve: sale,
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
    const payload = await request.validateUsing(updateSaleValidator)

    const sale = await Sale.find(params.id)
    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = sale.toJSON()

      const oldRows = await db
        .from('sale_products')
        .useTransaction(trx)
        .where('sale_id', sale.id)
        .select('product_id')

      const oldIds = uniqPositiveInts(oldRows.map((r: any) => r.product_id))

      const newStart = payload.start_datetime ? DateTime.fromJSDate(payload.start_datetime) : sale.startDatetime
      const newEnd = payload.end_datetime ? DateTime.fromJSDate(payload.end_datetime) : sale.endDatetime
      const willBePublished = payload.is_publish ?? sale.isPublish

      const productsProvided = payload.products !== undefined
      const newIds = productsProvided
        ? uniqPositiveInts((payload.products || []).map((p) => p.product_id))
        : oldIds

      // ✅ BLOCK: produk yg kena Discount (auto) overlap periode promo tidak boleh ada di Sale
      if (willBePublished && newIds.length) {
        const promoStart = newStart.setZone('Asia/Jakarta')
        const promoEnd = newEnd.setZone('Asia/Jakarta')

        const conflicts = await findDiscountConflictsForProducts(trx, newIds, promoStart, promoEnd)
        if (conflicts.productIds.length) {
          await trx.rollback()
          return response.status(409).send({
            message: 'Produk sedang ikut Discount (auto) pada periode tersebut. Tidak bisa dimasukkan ke Sale.',
            serve: {
              code: 'DISCOUNT_CONFLICT',
              productIds: conflicts.productIds,
              discountIds: conflicts.discountIds,
            },
          })
        }
      }

      sale.merge({
        title: payload.title ?? sale.title,
        description: payload.description ?? sale.description,
        hasButton: payload.has_button ?? sale.hasButton,
        buttonText: payload.button_text ?? sale.buttonText,
        buttonUrl: payload.button_url ?? sale.buttonUrl,
        startDatetime: payload.start_datetime ? DateTime.fromJSDate(payload.start_datetime) : sale.startDatetime,
        endDatetime: payload.end_datetime ? DateTime.fromJSDate(payload.end_datetime) : sale.endDatetime,
        isPublish: payload.is_publish ?? sale.isPublish,
        updatedBy: auth.user?.id,
      })

      await sale.useTransaction(trx).save()

      // ✅ kalau products dikirim (meskipun []), berarti replace pivot
      if (productsProvided) {
        await SaleProduct.query({ client: trx }).where('sale_id', sale.id).delete()

        for (const p of payload.products || []) {
          await SaleProduct.create(
            {
              saleId: sale.id,
              productId: p.product_id,
              salePrice: p.sale_price,
              stock: p.stock,
            },
            { client: trx }
          )
        }
      }

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Sale ${oldData.title}`,
        menu: 'Sale',
        data: { old: oldData, new: sale.toJSON() },
      })

      return response.status(200).send({
        message: 'Sale updated successfully',
        serve: sale,
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
    const sale = await Sale.find(params.id)
    if (!sale) {
      return response.status(404).send({
        message: 'Sale not found',
        serve: null,
      })
    }

    const trx = await db.transaction()

    try {
      const oldData = sale.toJSON()

      await SaleProduct.query({ client: trx }).where('sale_id', sale.id).delete()
      await sale.useTransaction(trx).delete()

      await trx.commit()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Sale ${oldData.title}`,
        menu: 'Sale',
        data: oldData,
      })

      return response.status(200).send({
        message: 'Sale deleted successfully',
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
