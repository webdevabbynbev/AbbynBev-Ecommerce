import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import UserAddress from '#models/user_address'
import axios from 'axios'
import db from '@adonisjs/lucid/services/db'
import qs from 'qs'

const BASE_URL = String(env.get('KOMERCE_COST_BASE_URL') || '')
  .trim()
  .replace(/\/+$/, '')
const API_KEY = String(env.get('KOMERCE_COST_API_KEY') || '').trim()

/** =========================
 *  Generic cache + inflight
 *  ========================= */
type CacheValue = { exp: number; data: unknown }
const cacheStore = new Map<string, CacheValue>()
const inflight = new Map<string, Promise<unknown>>()

function cacheGet(key: string) {
  const it = cacheStore.get(key)
  if (!it) return null
  if (Date.now() > it.exp) {
    cacheStore.delete(key)
    return null
  }
  return it.data
}

function cacheSet(key: string, data: unknown, ttlMs: number) {
  cacheStore.set(key, { exp: Date.now() + ttlMs, data })
}

async function cachedFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>) {
  const cached = cacheGet(key)
  if (cached) return { data: cached as T, cached: true as const }

  const running = inflight.get(key)
  if (running) {
    const data = await running
    return { data: data as T, cached: true as const, coalesced: true as const }
  }

  const p: Promise<unknown> = (async () => {
    const data = await fetcher()
    cacheSet(key, data, ttlMs)
    return data
  })()

  inflight.set(key, p)

  try {
    const data = await p
    return { data: data as T, cached: false as const }
  } finally {
    inflight.delete(key)
  }
}

/** =========================
 *  Helpers
 *  ========================= */
function pickInput(request: any, keys: string[], fallback: any = undefined) {
  for (const k of keys) {
    const v = request.input(k)
    if (typeof v !== 'undefined' && v !== null && v !== '') return v
  }
  return fallback
}

// FE kadang kirim object {label,value} / {id,name} dari react-select
function unwrapSelectValue(v: any): any {
  if (Array.isArray(v)) return unwrapSelectValue(v[0])
  if (v && typeof v === 'object') {
    if (typeof v.value !== 'undefined') return unwrapSelectValue(v.value)
    if (typeof v.id !== 'undefined') return unwrapSelectValue(v.id)
    if (typeof v.key !== 'undefined') return unwrapSelectValue(v.key)
    if (typeof v.label !== 'undefined') return unwrapSelectValue(v.label)
    if (typeof v.name !== 'undefined') return unwrapSelectValue(v.name)
  }
  return v
}

function pickInputU(request: any, keys: string[], fallback: any = undefined) {
  return unwrapSelectValue(pickInput(request, keys, fallback))
}

function toInt(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

/**
 * courier multi: pakai ":" (bukan koma)
 * normalize: "jne, jnt : pos" -> "jne:jnt:pos"
 */
function cleanCourier(courier: unknown): string {
  if (Array.isArray(courier)) courier = courier.join(':')
  const s = String(courier ?? '').trim()
  if (!s) return ''
  return s
    .replace(/,/g, ':')
    .replace(/\s+/g, '')
    .replace(/:+/g, ':')
    .replace(/^:|:$/g, '')
    .toLowerCase()
}

function getCourierAll(): string {
  // kalau env ada, pakai env
  const envList = cleanCourier(env.get('KOMERCE_COURIERS'))
  if (envList) return envList

  // fallback default (biar nggak kosong)
  return 'jne:sicepat:jnt:anteraja:pos:tiki:ninja:wahana:lion'
}

// TTL cache
const TTL_LOC_MS = 24 * 60 * 60 * 1000 // 24 jam
const TTL_COST_MS = 5 * 60 * 1000 // 5 menit

async function fetchListCached(cacheKey: string, url: string): Promise<any[]> {
  const { data } = await cachedFetch<any>(cacheKey, TTL_LOC_MS, async () => {
    const res = await axios.get(url, { headers: { key: API_KEY } })
    return res.data?.data ?? res.data
  })

  if (Array.isArray(data)) return data
  const inner = (data as any)?.data
  return Array.isArray(inner) ? inner : []
}

function normName(v: unknown) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function findByIdOrName(list: any[], input: unknown) {
  const raw = String(input ?? '').trim()
  if (!raw) return null

  const byId = list.find((x) => String(x?.id) === raw)
  if (byId) return byId

  const target = normName(raw)
  return list.find((x) => normName(x?.name) === target)
}

async function resolveProvince(provinceInput: unknown) {
  const provinces = await fetchListCached('loc:province', `${BASE_URL}/destination/province`)
  const p = findByIdOrName(provinces, provinceInput)
  if (!p) return null
  return { id: toInt(p.id, 0), raw: p }
}

async function resolveCity(provinceId: number, cityInput: unknown) {
  const cities = await fetchListCached(`loc:city:${provinceId}`, `${BASE_URL}/destination/city/${provinceId}`)
  const c = findByIdOrName(cities, cityInput)
  if (!c) return null
  return { id: toInt(c.id, 0), raw: c }
}

async function resolveDistrict(cityId: number, districtInput: unknown) {
  const districts = await fetchListCached(`loc:district:${cityId}`, `${BASE_URL}/destination/district/${cityId}`)
  const d = findByIdOrName(districts, districtInput)
  if (!d) return null
  return { id: toInt(d.id, 0), raw: d }
}

async function resolveSubDistrict(districtId: number, subInput: unknown) {
  const subs = await fetchListCached(`loc:subdistrict:${districtId}`, `${BASE_URL}/destination/sub-district/${districtId}`)
  const s = findByIdOrName(subs, subInput)
  if (!s) return null
  return { id: toInt(s.id, 0), raw: s }
}

export default class UserAddressesController {
  public async list({ response, auth }: HttpContext) {
    try {
      const addresses = await UserAddress.query().where('user_id', auth.user?.id ?? 0)
      return response.status(200).send({ message: 'Success', serve: addresses })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      if (!BASE_URL || !API_KEY) {
        await trx.rollback()
        return response.status(500).send({
          message: 'KOMERCE config missing (KOMERCE_COST_BASE_URL / KOMERCE_COST_API_KEY).',
          serve: null,
        })
      }

      const provinceInput = pickInputU(request, ['province', 'province_id', 'provinceId'])
      const cityInput = pickInputU(request, ['city', 'city_id', 'cityId'])
      const districtInput = pickInputU(request, ['district', 'district_id', 'districtId'])
      const subInput = pickInputU(request, ['subdistrict', 'sub_district', 'subDistrict', 'subdistrict_id', 'subDistrictId'])

      const isActive = toInt(pickInputU(request, ['is_active', 'isActive'], 1), 1)

      if (!provinceInput || !cityInput || !districtInput || !subInput) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Province, city, district & subdistrict are required.',
          serve: null,
        })
      }

      const province = await resolveProvince(provinceInput)
      if (!province?.id) {
        await trx.rollback()
        return response.status(400).send({ message: 'Province not found', serve: null })
      }

      const city = await resolveCity(province.id, cityInput)
      if (!city?.id) {
        await trx.rollback()
        return response.status(400).send({ message: 'City not found', serve: null })
      }

      const district = await resolveDistrict(city.id, districtInput)
      if (!district?.id) {
        await trx.rollback()
        return response.status(400).send({ message: 'District not found', serve: null })
      }

      const subDistrict = await resolveSubDistrict(district.id, subInput)
      if (!subDistrict?.id) {
        await trx.rollback()
        return response.status(400).send({ message: 'Subdistrict not found', serve: null })
      }

      const dataAddress = new UserAddress()
      dataAddress.address = pickInputU(request, ['address'])
      dataAddress.isActive = isActive
      dataAddress.userId = auth.user?.id ?? 0

      dataAddress.province = province.id
      dataAddress.city = city.id
      dataAddress.district = district.id
      dataAddress.subDistrict = subDistrict.id

      dataAddress.picName = pickInputU(request, ['pic_name', 'picName'])
      dataAddress.picPhone = pickInputU(request, ['pic_phone', 'picPhone'])
      dataAddress.picLabel = pickInputU(request, ['pic_label', 'picLabel'])
      dataAddress.benchmark = pickInputU(request, ['benchmark'])

      const zip = (subDistrict.raw as any)?.zip_code ?? (subDistrict.raw as any)?.zipCode
      dataAddress.postalCode = zip || pickInputU(request, ['postal_code', 'postalCode']) || null

      await dataAddress.useTransaction(trx).save()

      if (dataAddress.isActive === 2) {
        await UserAddress.query({ client: trx })
          .where('user_id', auth.user?.id ?? 0)
          .where('id', '!=', dataAddress.id)
          .where('is_active', 2)
          .update({ is_active: 1 })
      }

      await trx.commit()
      return response.status(200).send({ message: 'Successfully created address.', serve: dataAddress })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal server error.',
        serve: error.response?.data || null,
      })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      if (!BASE_URL || !API_KEY) {
        await trx.rollback()
        return response.status(500).send({
          message: 'KOMERCE config missing (KOMERCE_COST_BASE_URL / KOMERCE_COST_API_KEY).',
          serve: null,
        })
      }

      const id = pickInputU(request, ['id'])
      const dataAddress = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', auth.user?.id ?? 0)
        .first()

      if (!dataAddress) {
        await trx.rollback()
        return response.status(404).send({ message: 'Address not found.', serve: null })
      }

      const is_active = pickInputU(request, ['is_active', 'isActive'])
      const address = pickInputU(request, ['address'])
      const picName = pickInputU(request, ['pic_name', 'picName'])
      const picPhone = pickInputU(request, ['pic_phone', 'picPhone'])
      const picLabel = pickInputU(request, ['pic_label', 'picLabel'])
      const benchmark = pickInputU(request, ['benchmark'])
      const postalCode = pickInputU(request, ['postal_code', 'postalCode'])

      const provinceInput = pickInputU(request, ['province', 'province_id', 'provinceId'])
      const cityInput = pickInputU(request, ['city', 'city_id', 'cityId'])
      const districtInput = pickInputU(request, ['district', 'district_id', 'districtId'])
      const subInput = pickInputU(request, ['subdistrict', 'sub_district', 'subDistrict', 'subdistrict_id', 'subDistrictId'])

      const wantsUpdateLocation =
        typeof provinceInput !== 'undefined' ||
        typeof cityInput !== 'undefined' ||
        typeof districtInput !== 'undefined' ||
        typeof subInput !== 'undefined'

      if (wantsUpdateLocation) {
        const pIn = typeof provinceInput !== 'undefined' ? provinceInput : dataAddress.province
        const cIn = typeof cityInput !== 'undefined' ? cityInput : dataAddress.city
        const dIn = typeof districtInput !== 'undefined' ? districtInput : dataAddress.district
        const sIn = typeof subInput !== 'undefined' ? subInput : dataAddress.subDistrict

        if (!pIn || !cIn || !dIn || !sIn) {
          await trx.rollback()
          return response.status(400).send({
            message: 'Province, city, district & subdistrict are required when updating location.',
            serve: null,
          })
        }

        const province = await resolveProvince(pIn)
        if (!province?.id) {
          await trx.rollback()
          return response.status(400).send({ message: 'Province not found', serve: null })
        }

        const city = await resolveCity(province.id, cIn)
        if (!city?.id) {
          await trx.rollback()
          return response.status(400).send({ message: 'City not found', serve: null })
        }

        const district = await resolveDistrict(city.id, dIn)
        if (!district?.id) {
          await trx.rollback()
          return response.status(400).send({ message: 'District not found', serve: null })
        }

        const subDistrict = await resolveSubDistrict(district.id, sIn)
        if (!subDistrict?.id) {
          await trx.rollback()
          return response.status(400).send({ message: 'Subdistrict not found', serve: null })
        }

        dataAddress.province = province.id
        dataAddress.city = city.id
        dataAddress.district = district.id
        dataAddress.subDistrict = subDistrict.id

        const zip = (subDistrict.raw as any)?.zip_code ?? (subDistrict.raw as any)?.zipCode
        dataAddress.postalCode = zip || postalCode || dataAddress.postalCode
      }

      if (typeof is_active !== 'undefined') dataAddress.isActive = toInt(is_active, dataAddress.isActive)
      if (typeof address !== 'undefined') dataAddress.address = address
      if (typeof picName !== 'undefined') dataAddress.picName = picName
      if (typeof picPhone !== 'undefined') dataAddress.picPhone = picPhone
      if (typeof picLabel !== 'undefined') dataAddress.picLabel = picLabel
      if (typeof benchmark !== 'undefined') dataAddress.benchmark = benchmark

      await dataAddress.useTransaction(trx).save()

      if (dataAddress.isActive === 2) {
        await UserAddress.query({ client: trx })
          .where('user_id', auth.user?.id ?? 0)
          .where('id', '!=', dataAddress.id)
          .where('is_active', 2)
          .update({ is_active: 1 })
      }

      await trx.commit()
      return response.status(200).send({ message: 'Successfully updated address.', serve: dataAddress })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal server error.',
        serve: error.response?.data || null,
      })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const id = pickInputU(request, ['id'])
      const dataAddress = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', auth.user?.id ?? 0)
        .first()

      if (!dataAddress) {
        await trx.rollback()
        return response.status(404).send({ message: 'Address not found.', serve: [] })
      }

      await dataAddress.useTransaction(trx).delete()
      await trx.commit()

      return response.status(200).send({ message: 'Successfully deleted address.', serve: [] })
    } catch (error: any) {
      await trx.rollback()
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
    }
  }

  // ======================
  // Location endpoints (cached 24h)
  // ======================
  public async getProvince({ response }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) return response.status(500).send({ message: 'KOMERCE config missing.', serve: null })

      const { data, cached } = await cachedFetch('loc:province', TTL_LOC_MS, async () => {
        const { data } = await axios.get(`${BASE_URL}/destination/province`, { headers: { key: API_KEY } })
        return data?.data ?? data
      })

      return response.status(200).send({ message: 'Success', serve: data, meta: { cached } })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  public async getCity({ response, request }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) return response.status(500).send({ message: 'KOMERCE config missing.', serve: null })

      const provinceId = request.qs().province
      const key = `loc:city:${provinceId}`

      const { data, cached } = await cachedFetch(key, TTL_LOC_MS, async () => {
        const { data } = await axios.get(`${BASE_URL}/destination/city/${provinceId}`, { headers: { key: API_KEY } })
        return data?.data ?? data
      })

      return response.status(200).send({ message: 'Success', serve: data, meta: { cached } })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  public async getDistrict({ response, request }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) return response.status(500).send({ message: 'KOMERCE config missing.', serve: null })

      const cityId = request.qs().city
      const key = `loc:district:${cityId}`

      const { data, cached } = await cachedFetch(key, TTL_LOC_MS, async () => {
        const { data } = await axios.get(`${BASE_URL}/destination/district/${cityId}`, { headers: { key: API_KEY } })
        return data?.data ?? data
      })

      return response.status(200).send({ message: 'Success', serve: data, meta: { cached } })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  public async getSubDistrict({ response, request }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) return response.status(500).send({ message: 'KOMERCE config missing.', serve: null })

      const districtId = request.qs().district
      const key = `loc:subdistrict:${districtId}`

      const { data, cached } = await cachedFetch(key, TTL_LOC_MS, async () => {
        const { data } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
          headers: { key: API_KEY },
        })
        return data?.data ?? data
      })

      return response.status(200).send({ message: 'Success', serve: data, meta: { cached } })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  // ======================
  // Shipping cost (FIX: pakai district endpoint)
  // ======================
  public async getCost({ request, response }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) {
        return response.status(500).send({
          message: 'KOMERCE config missing (KOMERCE_COST_BASE_URL / KOMERCE_COST_API_KEY).',
          serve: null,
        })
      }

      // ✅ untuk endpoint district/domestic-cost, yang dipakai adalah DISTRICT ID
      const destination = toInt(
        pickInputU(request, ['destination', 'district', 'district_id', 'districtId']),
        0
      )

      const weightRaw = Math.max(1, toInt(pickInputU(request, ['weight'], 1), 1))
      const weightStep = toInt(env.get('KOMERCE_WEIGHT_STEP'), 0) // optional, misal 100
      const weight = weightStep > 0 ? Math.ceil(weightRaw / weightStep) * weightStep : weightRaw

      const originFromReq = pickInputU(request, ['origin'])
      const origin = toInt(originFromReq ?? env.get('KOMERCE_ORIGIN'), 0)

      const priceIn = String(pickInputU(request, ['price'], 'lowest')).toLowerCase()
const allowedPrice = new Set(['lowest', 'highest'])
const price = allowedPrice.has(priceIn) ? priceIn : 'lowest'

      const noCache = toInt(pickInputU(request, ['no_cache', 'noCache'], 0), 0) === 1

      // courier: "all" -> pakai env KOMERCE_COURIERS atau default fallback
      const courierRaw = String(pickInputU(request, ['courier'], 'all')).toLowerCase()
      const courier = courierRaw === 'all' || !courierRaw ? getCourierAll() : cleanCourier(courierRaw)

      if (!origin || !destination) {
        return response.status(400).send({
          message: 'Origin/Destination invalid. Pastikan KOMERCE_ORIGIN (district id) & destination (district id) valid.',
          serve: null,
          meta: { origin, destination, weight, courier, price },
        })
      }

      const endpoint = '/calculate/district/domestic-cost'

      const payload: Record<string, any> = { origin, destination, weight, courier, price }

      const cacheKey = `cost:${endpoint}:${origin}:${destination}:${weight}:${courier}:${price}`

      const hit = async () => {
        const body = qs.stringify(payload)
        const { data } = await axios.post(`${BASE_URL}${endpoint}`, body, {
          headers: { key: API_KEY, 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        })
        // biasanya {meta, data}
        return data?.data ?? data
      }

      if (noCache) {
        const result = await hit()
        return response.status(200).send({
          message: 'Success',
          serve: result,
          meta: { ...payload, cached: false, noCache: true },
        })
      }

      const { data: result, cached, coalesced } = await cachedFetch(cacheKey, TTL_COST_MS, hit)

      return response.status(200).send({
        message: 'Success',
        serve: result,
        meta: {
          ...payload,
          cached,
          coalesced: !!coalesced,
          ttlSec: Math.floor(TTL_COST_MS / 1000),
        },
      })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({
        message: e?.response?.data?.meta?.message || e.message || 'Internal Server Error',
        serve: e.response?.data || null,
      })
    }
  }
}
