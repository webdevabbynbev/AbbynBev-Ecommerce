import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

function clean(s: any) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function applyWords(qb: any, column: string, phrase: any) {
  const words = clean(phrase).split(' ').filter(Boolean)
  for (const w of words) {
    qb.whereRaw(`LOWER(${column}) LIKE ?`, [`%${w}%`])
  }
}

export default class RegionsController {
  // GET /regions/cities?q=cimahi&limit=20
  public async cities({ request, response }: HttpContext) {
    const { q = '', limit = 20 } = request.qs()
    const qq = clean(q)
    const take = Math.max(1, Math.min(Number(limit) || 20, 50))

    if (!qq) return response.ok({ serve: [] })

    const qb = db.from('cities').select('id', 'name').orderBy('name', 'asc').limit(take)
    applyWords(qb, 'name', qq)

    const rows = await qb
    return response.ok({ serve: rows })
  }

  // GET /regions/districts?city_id=123&q=...&limit=50
  public async districts({ request, response }: HttpContext) {
    const { city_id, cityId, q = '', limit = 50 } = request.qs()
    const cid = Number(city_id ?? cityId ?? 0)
    const qq = clean(q)
    const take = Math.max(1, Math.min(Number(limit) || 50, 100))

    if (!cid) return response.ok({ serve: [] })

    const qb = db
      .from('districts')
      .select('id', 'name')
      .where('city_id', cid)
      .orderBy('name', 'asc')
      .limit(take)

    if (qq) applyWords(qb, 'name', qq)

    const rows = await qb
    return response.ok({ serve: rows })
  }

  // GET /regions/sub-districts?district_id=456&q=...&limit=80
  public async subDistricts({ request, response }: HttpContext) {
    const { district_id, districtId, q = '', limit = 80 } = request.qs()
    const did = Number(district_id ?? districtId ?? 0)
    const qq = clean(q)
    const take = Math.max(1, Math.min(Number(limit) || 80, 200))

    if (!did) return response.ok({ serve: [] })

    const qb = db
      .from('sub_districts')
      .select('id', 'name', 'zip_code')
      .where('district_id', did)
      .orderBy('name', 'asc')
      .limit(take)

    if (qq) applyWords(qb, 'name', qq)

    const rows = await qb
    return response.ok({ serve: rows })
  }

  // GET /regions/postal-codes?sub_district_id=789
  public async postalCodes({ request, response }: HttpContext) {
    const { sub_district_id, subDistrictId } = request.qs()
    const sid = Number(sub_district_id ?? subDistrictId ?? 0)
    if (!sid) return response.ok({ serve: [] })

    const row = await db.from('sub_districts').select('zip_code').where('id', sid).first()

    const z = String(row?.zip_code || '').trim()
    const list = z ? [z] : [] // (di DB kamu 1 kelurahan = 1 zip_code)
    return response.ok({ serve: list })
  }
}
