import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import UserAddress from '#models/user_address'
import axios from 'axios'
import db from '@adonisjs/lucid/services/db'

/** =========================
 *  BITESHIP config
 *  ========================= */
const BITESHIP_BASE_URL = String(env.get('BITESHIP_BASE_URL') || '').trim().replace(/\/+$/, '')
const BITESHIP_API_KEY = String(env.get('BITESHIP_API_KEY') || '').trim()

// Origin (recommended: origin area id; fallback: postal code toko)
const ORIGIN_AREA_ID = String(env.get('BITESHIP_ORIGIN_AREA_ID') || '').trim()
const ORIGIN_POSTAL_CODE = String(env.get('COMPANY_POSTAL_CODE') || '').trim()

function toInt(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}
function pickInput(request: any, keys: string[], fallback: any = undefined) {
  for (const k of keys) {
    const v = request.input(k)
    if (typeof v !== 'undefined' && v !== null && v !== '') return v
  }
  return fallback
}
function isPostalCode(v: unknown) {
  const s = String(v ?? '').trim()
  return /^[0-9]{5}$/.test(s)
}
function getCourierAll(): string {
  const s = String(env.get('BITESHIP_COURIERS') || '').trim()
  return s || 'jne,sicepat,jnt,anteraja,pos,tiki,ninja,wahana,lion'
}

const biteship = axios.create({
  baseURL: `${BITESHIP_BASE_URL}/v1`,
  headers: {
    authorization: BITESHIP_API_KEY,
    accept: 'application/json',
    'content-type': 'application/json',
  },
  timeout: 30_000,
})

/** =========================
 *  Cache (simple)
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
  if (cached !== null) return { data: cached as T, cached: true as const }

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

const TTL_SEARCH_MS = 24 * 60 * 60 * 1000
const TTL_COST_MS = 5 * 60 * 1000

export default class UserAddressesController {
  /** ======================
   *  Address CRUD
   *  ====================== */
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
      const areaObj = pickInput(request, ['area'])
      const areaIdIn = pickInput(request, ['area_id', 'areaId', 'biteship_area_id', 'biteshipAreaId'])
      const areaNameIn = pickInput(request, ['area_name', 'areaName', 'biteship_area_name', 'biteshipAreaName'])
      const postalIn = pickInput(request, ['postal_code', 'postalCode'])

      const areaId = String(areaObj?.id ?? areaIdIn ?? '').trim()
      const areaName = String(areaObj?.name ?? areaNameIn ?? '').trim()
      const postalFromArea = areaObj?.postal_code ?? areaObj?.postalCode
      const postalCode = String(postalFromArea ?? postalIn ?? '').trim()

      if (!areaId) {
        await trx.rollback()
        return response.status(400).send({
          message: 'area_id is required (ambil dari Biteship Maps /v1/maps/areas).',
          serve: null,
        })
      }

      const isActive = toInt(pickInput(request, ['is_active', 'isActive'], 1), 1)

      const dataAddress = new UserAddress()
      dataAddress.userId = auth.user?.id ?? 0
      dataAddress.isActive = isActive

      // ✅ simpan biteship area id/name (pakai any dulu supaya tidak error sebelum model diupdate)
      ;(dataAddress as any).biteshipAreaId = areaId
      ;(dataAddress as any).biteshipAreaName = areaName || ''

      // ✅ jangan set province/city/district/subDistrict ke null dulu (biar gak bentrok tipe/DB)
      // biarkan field lama untouched

      dataAddress.address = String(pickInput(request, ['address'], '') || '')
      dataAddress.picName = String(pickInput(request, ['pic_name', 'picName'], '') || '')
      dataAddress.picPhone = String(pickInput(request, ['pic_phone', 'picPhone'], '') || '')
      dataAddress.picLabel = String(pickInput(request, ['pic_label', 'picLabel'], '') || '')
      dataAddress.benchmark = String(pickInput(request, ['benchmark'], '') || '')

      // ✅ TS-safe: jangan assign null
      dataAddress.postalCode = postalCode || ''

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
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const id = pickInput(request, ['id'])
      const dataAddress = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', auth.user?.id ?? 0)
        .first()

      if (!dataAddress) {
        await trx.rollback()
        return response.status(404).send({ message: 'Address not found.', serve: null })
      }

      // optional update area
      const areaObj = pickInput(request, ['area'])
      const areaIdIn = pickInput(request, ['area_id', 'areaId', 'biteship_area_id', 'biteshipAreaId'])
      const areaNameIn = pickInput(request, ['area_name', 'areaName', 'biteship_area_name', 'biteshipAreaName'])
      const postalIn = pickInput(request, ['postal_code', 'postalCode'])

      const areaId = String(areaObj?.id ?? areaIdIn ?? '').trim()
      const areaName = String(areaObj?.name ?? areaNameIn ?? '').trim()
      const postalFromArea = areaObj?.postal_code ?? areaObj?.postalCode
      const postalCode = String(postalFromArea ?? postalIn ?? '').trim()

      if (areaId) {
        ;(dataAddress as any).biteshipAreaId = areaId
        ;(dataAddress as any).biteshipAreaName = areaName || (dataAddress as any).biteshipAreaName || ''
      }

      const is_active = pickInput(request, ['is_active', 'isActive'])
      const address = pickInput(request, ['address'])
      const picName = pickInput(request, ['pic_name', 'picName'])
      const picPhone = pickInput(request, ['pic_phone', 'picPhone'])
      const picLabel = pickInput(request, ['pic_label', 'picLabel'])
      const benchmark = pickInput(request, ['benchmark'])

      if (typeof is_active !== 'undefined') dataAddress.isActive = toInt(is_active, dataAddress.isActive)
      if (typeof address !== 'undefined') dataAddress.address = String(address)
      if (typeof picName !== 'undefined') dataAddress.picName = String(picName)
      if (typeof picPhone !== 'undefined') dataAddress.picPhone = String(picPhone)
      if (typeof picLabel !== 'undefined') dataAddress.picLabel = String(picLabel)
      if (typeof benchmark !== 'undefined') dataAddress.benchmark = String(benchmark)

      if (postalCode) dataAddress.postalCode = postalCode

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
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: error.response?.data || null })
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
      return response.status(500).send({ message: error.message || 'Internal Server Error', serve: error.response?.data || null })
    }
  }

  /** ======================
   *  Search lokasi via Biteship Maps
   *  GET /areas?input=bandung
   *  ====================== */
  public async searchAreas({ request, response }: HttpContext) {
    try {
      if (!BITESHIP_BASE_URL || !BITESHIP_API_KEY) {
        return response.status(500).send({ message: 'BITESHIP config missing.', serve: null })
      }

      const input = String(request.qs().input || '').trim()
      if (!input) return response.status(400).send({ message: 'input is required', serve: null })

      const countries = String(request.qs().countries || 'ID').trim()
      const type = String(request.qs().type || 'single').trim()

      const cacheKey = `biteship:areas:${countries}:${type}:${input.toLowerCase()}`
      const { data, cached } = await cachedFetch(cacheKey, TTL_SEARCH_MS, async () => {
        const { data } = await biteship.get('/maps/areas', { params: { countries, input, type } })
        return data
      })

      return response.status(200).send({ message: 'Success', serve: data, meta: { cached } })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({ message: e.message || 'Internal Server Error', serve: e.response?.data || null })
    }
  }

  /** ======================
   *  Ongkir via Biteship Rates
   *  POST /get-cost
   *  Body recommended: { address_id, weight, value, quantity, couriers }
   *  ====================== */
  public async getCost({ request, response, auth }: HttpContext) {
    try {
      if (!BITESHIP_BASE_URL || !BITESHIP_API_KEY) {
        return response.status(500).send({ message: 'BITESHIP config missing.', serve: null })
      }

      const addressId = toInt(pickInput(request, ['address_id', 'addressId'], 0), 0)

      let destinationAreaId = String(pickInput(request, ['destination_area_id', 'destinationAreaId'], '') || '').trim()
      let destinationPostal = String(pickInput(request, ['destination_postal_code', 'destinationPostalCode'], '') || '').trim()

      if (addressId) {
        const addr = await UserAddress.query()
          .where('id', addressId)
          .where('user_id', auth.user?.id ?? 0)
          .first()

        if (!addr) return response.status(404).send({ message: 'Address not found.', serve: null })

        destinationAreaId = String((addr as any).biteshipAreaId || '').trim()
        destinationPostal = String(addr.postalCode || '').trim()
      }

      const weight = Math.max(1, toInt(pickInput(request, ['weight'], 1), 1))
      const value = Math.max(1, toInt(pickInput(request, ['value', 'amount', 'total'], 1), 1))
      const quantity = Math.max(1, toInt(pickInput(request, ['quantity', 'qty'], 1), 1))

      const courierRaw = String(pickInput(request, ['courier', 'couriers'], 'all')).toLowerCase()
      const couriers = courierRaw === 'all' || !courierRaw ? getCourierAll() : courierRaw

      const payload: any = {
        couriers,
        items: [{ name: 'Order', description: 'Ecommerce order', value, quantity, weight }],
      }

      if (ORIGIN_AREA_ID && destinationAreaId) {
        payload.origin_area_id = ORIGIN_AREA_ID
        payload.destination_area_id = destinationAreaId
      } else {
        if (!isPostalCode(ORIGIN_POSTAL_CODE)) {
          return response.status(500).send({
            message: 'Origin not configured. Set BITESHIP_ORIGIN_AREA_ID or valid COMPANY_POSTAL_CODE.',
            serve: null,
          })
        }
        if (!isPostalCode(destinationPostal)) {
          return response.status(400).send({
            message: 'Destination invalid. Provide destination_area_id OR destination_postal_code (or save postalCode in address).',
            serve: null,
            meta: { destinationAreaId, destinationPostal },
          })
        }
        payload.origin_postal_code = toInt(ORIGIN_POSTAL_CODE, 0)
        payload.destination_postal_code = toInt(destinationPostal, 0)
      }

      const noCache = toInt(pickInput(request, ['no_cache', 'noCache'], 0), 0) === 1
      const cacheKey = `biteship:rates:${JSON.stringify(payload)}`

      const hit = async () => {
        const { data } = await biteship.post('/rates/couriers', payload)
        return Array.isArray(data?.pricing) ? data.pricing : []
      }

      if (noCache) {
        const result = await hit()
        return response.status(200).send({ message: 'Success', serve: result, meta: { cached: false, noCache: true, payload } })
      }

      const { data: result, cached, coalesced } = await cachedFetch(cacheKey, TTL_COST_MS, hit)

      return response.status(200).send({
        message: 'Success',
        serve: result,
        meta: { cached, coalesced: !!coalesced, ttlSec: Math.floor(TTL_COST_MS / 1000), payload },
      })
    } catch (e: any) {
      const status = e?.response?.status || 500
      return response.status(status).send({
        message: e?.response?.data?.message || e.message || 'Internal Server Error',
        serve: e.response?.data || null,
      })
    }
  }
}
