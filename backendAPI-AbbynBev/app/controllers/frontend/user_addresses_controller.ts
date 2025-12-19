import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import UserAddress from '#models/user_address'
import axios from 'axios'
import db from '@adonisjs/lucid/services/db'
import qs from 'qs'

const BASE_URL = String(env.get('KOMERCE_COST_BASE_URL') || '').trim()
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

function toInt(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function cleanCourier(courier: unknown): string {
  if (Array.isArray(courier)) courier = courier.join(',')
  const s = String(courier ?? '').trim()
  if (!s) return ''
  return s
    .replace(/:/g, ',')
    .replace(/\s+/g, '')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '')
}

function normalizeLocationType(v: unknown, fallback: string) {
  const s = String(v ?? '').trim().toLowerCase()
  const allowed = new Set(['province', 'city', 'district', 'subdistrict'])
  return allowed.has(s) ? s : fallback
}

function endpointForOriginType(originType: string) {
  const t = normalizeLocationType(originType, 'district')
  return `/calculate/${t}/domestic-cost`
}

/** unique + sort biar stabil */
function normalizeCourierList(raw: string): string {
  const tokens = cleanCourier(raw)
    .split(',')
    .map((x: string) => x.trim().toLowerCase())
    .filter((x: string) => x.length > 0)

  const uniq = Array.from(new Set(tokens))
  uniq.sort()
  return uniq.join(',')
}

/** env OPTIONAL */
function getCouriersFromEnvOptional(): string {
  const raw = cleanCourier(env.get('KOMERCE_COURIERS'))
  return raw ? normalizeCourierList(raw) : ''
}

/**
 * expand input courier:
 * - kalau "all"/kosong:
 *   - kalau env ada -> pakai env
 *   - kalau env kosong -> OMIT courier (biar API yang default)
 * - kalau spesifik -> pakai yang dikirim (dinormalisasi)
 */
function expandCourierInput(raw: unknown): { courier: string | null; usedEnv: boolean } {
  const c = cleanCourier(raw)

  const tokens = c
    ? c.split(',').map((x: string) => x.trim().toLowerCase()).filter(Boolean)
    : []

  const wantsAll = !c || c.toLowerCase() === 'all' || tokens.includes('all')

  if (wantsAll) {
    const envList = getCouriersFromEnvOptional()
    if (envList) return { courier: envList, usedEnv: true }
    return { courier: null, usedEnv: false } // ✅ no hardcode
  }

  return { courier: normalizeCourierList(c), usedEnv: false }
}

// TTL cache
const TTL_LOC_MS = 24 * 60 * 60 * 1000 // 24 jam
const TTL_COST_MS = 5 * 60 * 1000 // 5 menit

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

      const provinceId = pickInput(request, ['province'])
      const cityId = pickInput(request, ['city'])
      const districtId = pickInput(request, ['district'])
      const subDistrictId = pickInput(request, ['subdistrict', 'sub_district', 'subDistrict'])

      const isActive = toInt(pickInput(request, ['is_active', 'isActive'], 1), 1)

      if (!districtId || !subDistrictId) {
        await trx.rollback()
        return response.status(400).send({ message: 'District & subdistrict are required.', serve: null })
      }

      const key = `loc:subdistrict:${districtId}`
      const { data: subDistrictData } = await cachedFetch(key, TTL_LOC_MS, async () => {
        const { data } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
          headers: { key: API_KEY },
        })
        return data
      })

      const list = ((subDistrictData as any)?.data as any[]) || []
      const subDistrict = list.find((s) => String(s.id) === String(subDistrictId))
      if (!subDistrict) {
        await trx.rollback()
        return response.status(400).send({ message: 'Subdistrict not found', serve: null })
      }

      const dataAddress = new UserAddress()
      dataAddress.address = pickInput(request, ['address'])
      dataAddress.isActive = isActive
      dataAddress.userId = auth.user?.id ?? 0
      dataAddress.province = provinceId
      dataAddress.city = cityId
      dataAddress.district = districtId
      dataAddress.subDistrict = subDistrictId
      dataAddress.picName = pickInput(request, ['pic_name', 'picName'])
      dataAddress.picPhone = pickInput(request, ['pic_phone', 'picPhone'])
      dataAddress.picLabel = pickInput(request, ['pic_label', 'picLabel'])
      dataAddress.benchmark = pickInput(request, ['benchmark'])
      dataAddress.postalCode = subDistrict.zip_code

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
      return response
        .status(500)
        .send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
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

      const id = pickInput(request, ['id'])
      const dataAddress = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', auth.user?.id ?? 0)
        .first()

      if (!dataAddress) {
        await trx.rollback()
        return response.status(404).send({ message: 'Address not found.', serve: null })
      }

      const is_active = pickInput(request, ['is_active', 'isActive'])
      const address = pickInput(request, ['address'])
      const provinceId = pickInput(request, ['province'])
      const cityId = pickInput(request, ['city'])
      const districtId = pickInput(request, ['district'])
      const subDistrictId = pickInput(request, ['subdistrict', 'sub_district', 'subDistrict'])
      const postalCode = pickInput(request, ['postal_code', 'postalCode'])
      const picName = pickInput(request, ['pic_name', 'picName'])
      const picPhone = pickInput(request, ['pic_phone', 'picPhone'])
      const picLabel = pickInput(request, ['pic_label', 'picLabel'])
      const benchmark = pickInput(request, ['benchmark'])

      if (typeof districtId !== 'undefined' || typeof subDistrictId !== 'undefined') {
        if (!districtId || !subDistrictId) {
          await trx.rollback()
          return response.status(400).send({
            message: 'District & subdistrict are required when updating location.',
            serve: null,
          })
        }

        const key = `loc:subdistrict:${districtId}`
        const { data: subDistrictData } = await cachedFetch(key, TTL_LOC_MS, async () => {
          const { data } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
            headers: { key: API_KEY },
          })
          return data
        })

        const list = ((subDistrictData as any)?.data as any[]) || []
        const subDistrict = list.find((s) => String(s.id) === String(subDistrictId))
        if (!subDistrict) {
          await trx.rollback()
          return response.status(400).send({ message: 'Subdistrict not found', serve: null })
        }

        dataAddress.district = districtId
        dataAddress.subDistrict = subDistrictId
        dataAddress.postalCode = subDistrict.zip_code || postalCode || dataAddress.postalCode
      }

      if (typeof is_active !== 'undefined') dataAddress.isActive = toInt(is_active, dataAddress.isActive)
      if (typeof address !== 'undefined') dataAddress.address = address
      if (typeof provinceId !== 'undefined') dataAddress.province = provinceId
      if (typeof cityId !== 'undefined') dataAddress.city = cityId
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
      return response
        .status(500)
        .send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const id = pickInput(request, ['id'])
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
      return response
        .status(500)
        .send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
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
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  // ======================
  // Shipping cost (cached 5m + coalesced)
  // ======================
  public async getCost({ request, response }: HttpContext) {
    try {
      if (!BASE_URL || !API_KEY) {
        return response.status(500).send({
          message: 'KOMERCE config missing (KOMERCE_COST_BASE_URL / KOMERCE_COST_API_KEY).',
          serve: null,
        })
      }

      const destination = toInt(pickInput(request, ['destination', 'subdistrict', 'sub_district', 'subDistrict']), 0)

      const weightRaw = Math.max(1, toInt(pickInput(request, ['weight'], 1), 1))
      const weightStep = toInt(env.get('KOMERCE_WEIGHT_STEP'), 0) // optional (misal 100)
      const weight = weightStep > 0 ? Math.ceil(weightRaw / weightStep) * weightStep : weightRaw

      const originFromReq = pickInput(request, ['origin'])
      const origin = toInt(originFromReq ?? env.get('KOMERCE_ORIGIN'), 0)

      const originTypeFromReq = pickInput(request, ['origin_type', 'originType'])
      const originType = normalizeLocationType(originTypeFromReq ?? env.get('KOMERCE_ORIGIN_TYPE'), 'district')

      const destinationTypeFromReq = pickInput(request, ['destination_type', 'destinationType'])
      const destinationType = normalizeLocationType(destinationTypeFromReq ?? 'subdistrict', 'subdistrict')

      const { courier, usedEnv } = expandCourierInput(pickInput(request, ['courier'], 'all'))

      const price = String(pickInput(request, ['price'], 'all')).toLowerCase()
      const noCache = toInt(pickInput(request, ['no_cache', 'noCache'], 0), 0) === 1

      if (!origin || !destination) {
        return response.status(400).send({
          message: 'Origin/Destination invalid. Check KOMERCE_ORIGIN & destination id.',
          serve: null,
          meta: { origin, originType, destination, destinationType, weight, courier: courier ?? 'auto', price },
        })
      }

      const endpoint = endpointForOriginType(originType)

      // payload base (courier bisa di-omit)
      const payload: Record<string, any> = { origin, originType, destination, destinationType, weight, price }
      if (courier) payload.courier = courier

      const courierKey = courier ?? '__auto__'
      const cacheKey = `cost:${endpoint}:${origin}:${originType}:${destination}:${destinationType}:${weight}:${courierKey}:${price}`

      if (noCache) {
        const body = qs.stringify(payload)
        const { data } = await axios.post(`${BASE_URL}${endpoint}`, body, {
          headers: { key: API_KEY, 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        })
        return response.status(200).send({
          message: 'Success',
          serve: data?.data ?? data,
          meta: { ...payload, courier: courier ?? 'auto', cached: false, usedEnv, noCache: true },
        })
      }

      const { data: result, cached, coalesced } = await cachedFetch(cacheKey, TTL_COST_MS, async () => {
        const body = qs.stringify(payload)
        const { data } = await axios.post(`${BASE_URL}${endpoint}`, body, {
          headers: { key: API_KEY, 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        })
        return data?.data ?? data
      })

      return response.status(200).send({
        message: 'Success',
        serve: result,
        meta: {
          ...payload,
          courier: courier ?? 'auto',
          cached,
          coalesced: !!coalesced,
          ttlSec: Math.floor(TTL_COST_MS / 1000),
          usedEnv,
        },
      })
    } catch (e: any) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: e.response?.data || null,
      })
    }
  }
}
