import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import Brand from '#models/brand'
import Product from '#models/product'

function toInt(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default class DiscountOptionsController {
  public async brands({ request, response }: HttpContext) {
    try {
      const qs = request.qs()
      const q = String(qs.q ?? '').trim()
      const page = toInt(qs.page, 1) || 1
      const perPage = toInt(qs.per_page, 20) || 20

      // aman: kalau scopes.active() gak ada, ganti ke whereNull('deleted_at')
      const rows = await Brand.query()
        .whereNull('deleted_at')
        .if(q, (query) => query.whereILike('name', `%${q}%`))
        .orderBy('name', 'asc')
        .paginate(page, perPage)

      const json = rows.toJSON()
      const data = (json.data ?? []).map((b: any) => ({
        id: b.id,
        name: b.name,
      }))

      return response.ok({ message: 'success', serve: { data, ...json.meta } })
    } catch (e: any) {
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  public async products({ request, response }: HttpContext) {
    try {
      const qs = request.qs()
      const q = String(qs.q ?? '').trim()
      const page = toInt(qs.page, 1) || 1
      const perPage = toInt(qs.per_page, 20) || 20

      const rows = await Product.query()
        .whereNull('deleted_at')
        .if(q, (query) => {
          query.where((sub) => {
            sub
              .whereILike('products.name', `%${q}%`)
              .orWhereILike('products.slug', `%${q}%`)
              .orWhereILike('products.master_sku', `%${q}%`)
          })
        })
        .select(['id', 'name', 'brand_id'])
        .orderBy('name', 'asc')
        .paginate(page, perPage)

      const json = rows.toJSON()
      const data = (json.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brandId: p.brandId ?? p.brand_id ?? null,
      }))

      return response.ok({ message: 'success', serve: { data, ...json.meta } })
    } catch (e: any) {
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }

  /**
   * VARIANTS (NEW):
   * sekarang yang dipilih CMS untuk "Varian" adalah attribute_values.
   * Output:
   *  - id: attribute_value_id
   *  - value: isi value (contoh: "Merah", "L")
   *  - attributeName: nama attribute (contoh: "Warna", "Ukuran")
   */
  public async variants({ request, response }: HttpContext) {
    try {
      const qs = request.qs()
      const q = String(qs.q ?? '').trim()
      const page = toInt(qs.page, 1) || 1
      const perPage = toInt(qs.per_page, 20) || 20
      const offset = (page - 1) * perPage

      // query attribute_values + join attributes untuk label
      const base = db
        .from('attribute_values as av')
        .leftJoin('attributes as a', 'a.id', 'av.attribute_id')
        .whereNull('av.deleted_at')
        .select(
          'av.id',
          'av.value',
          db.raw('a.name as attributeName')
        )
        .orderBy('a.name', 'asc')
        .orderBy('av.value', 'asc')

      if (q) {
        base.andWhere((sub) => {
          sub.whereILike('av.value', `%${q}%`).orWhereILike('a.name', `%${q}%`)
        })
      }

      // paginate manual (lebih simple karena pakai query builder)
      const data = await base.clone().limit(perPage).offset(offset)

      // total count (biar meta mirip paginate)
      const countRow = await db
        .from('attribute_values as av')
        .leftJoin('attributes as a', 'a.id', 'av.attribute_id')
        .whereNull('av.deleted_at')
        .if(q, (query) => {
          query.andWhere((sub) => {
            sub.whereILike('av.value', `%${q}%`).orWhereILike('a.name', `%${q}%`)
          })
        })
        .count('* as total')
        .first()

      const total = Number(countRow?.total ?? 0)
      const lastPage = perPage > 0 ? Math.ceil(total / perPage) : 1

      return response.ok({
        message: 'success',
        serve: {
          data,
          total,
          perPage,
          currentPage: page,
          lastPage,
        },
      })
    } catch (e: any) {
      return response.status(500).send({ message: e?.message || 'Internal Server Error', serve: null })
    }
  }
}
