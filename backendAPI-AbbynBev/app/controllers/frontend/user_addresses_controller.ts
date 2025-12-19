import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import UserAddress from '#models/user_address'
import axios from 'axios'
import db from '@adonisjs/lucid/services/db'
import qs from 'qs'

const BASE_URL = env.get('KOMERCE_COST_BASE_URL')
const API_KEY = env.get('KOMERCE_COST_API_KEY')

// ===== simple in-memory cache (reduce hit) =====
type CacheValue = { exp: number; data: any }
const costCache = new Map<string, CacheValue>()
const COST_CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit

function cacheGet(key: string) {
  const it = costCache.get(key)
  if (!it) return null
  if (Date.now() > it.exp) {
    costCache.delete(key)
    return null
  }
  return it.data
}
function cacheSet(key: string, data: any) {
  costCache.set(key, { exp: Date.now() + COST_CACHE_TTL_MS, data })
}

/** ambil input dari beberapa kemungkinan key */
function pickInput(request: any, keys: string[], fallback: any = undefined) {
  for (const k of keys) {
    const v = request.input(k)
    if (typeof v !== 'undefined' && v !== null && v !== '') return v
  }
  return fallback
}

function toInt(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function cleanCourier(courier: any) {
  // boleh array, "jne:jnt:tiki", "jne,jnt,tiki"
  if (Array.isArray(courier)) courier = courier.join(',')
  courier = String(courier ?? '').trim()
  if (!courier) return 'jne'
  return courier
    .replace(/:/g, ',') // FE bisa kirim ":" biar gampang join
    .replace(/\s+/g, '') // buang spasi
    .replace(/,+/g, ',') // rapihin koma dobel
    .replace(/^,|,$/g, '') // buang koma depan/belakang
}

function normalizeLocationType(v: any, fallback: string) {
  const s = String(v ?? '').trim().toLowerCase()
  // set yang umum dipakai komerce/rajaongkir-like
  const allowed = new Set(['province', 'city', 'district', 'subdistrict'])
  return allowed.has(s) ? s : fallback
}

function endpointForOriginType(originType: string) {
  // aman: kalau originType aneh, fallback ke district
  const t = normalizeLocationType(originType, 'district')
  return `/calculate/${t}/domestic-cost`
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
      const provinceId = pickInput(request, ['province'])
      const cityId = pickInput(request, ['city'])
      const districtId = pickInput(request, ['district'])
      const subDistrictId = pickInput(request, ['subdistrict', 'sub_district', 'subDistrict'])

      const isActive = toInt(pickInput(request, ['is_active', 'isActive'], 1), 1)

      // validasi lokasi
      if (!districtId || !subDistrictId) {
        await trx.rollback()
        return response.status(400).send({
          message: 'District & subdistrict are required.',
          serve: null,
        })
      }

      const { data: subDistrictData } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
        headers: { key: API_KEY },
      })

      const subDistrict = (subDistrictData?.data as any[])?.find((s) => String(s.id) === String(subDistrictId))
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

      // kalau set main address, yang lain turun jadi 1
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
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: null })
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

      // kalau update lokasi, validasi district+subdistrict dan refresh zip dari API
      if (typeof districtId !== 'undefined' || typeof subDistrictId !== 'undefined') {
        if (!districtId || !subDistrictId) {
          await trx.rollback()
          return response.status(400).send({
            message: 'District & subdistrict are required when updating location.',
            serve: null,
          })
        }

        const { data: subDistrictData } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
          headers: { key: API_KEY },
        })

        const subDistrict = (subDistrictData?.data as any[])?.find((s) => String(s.id) === String(subDistrictId))
        if (!subDistrict) {
          await trx.rollback()
          return response.status(400).send({ message: 'Subdistrict not found.', serve: null })
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
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: null })
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
      return response.status(500).send({ message: error.message || 'Internal server error.', serve: [] })
    }
  }

  public async getProvince({ response }: HttpContext) {
    try {
      const { data } = await axios.get(`${BASE_URL}/destination/province`, { headers: { key: API_KEY } })
      return response.status(200).send({ message: 'Success', serve: data?.data ?? data })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getCity({ response, request }: HttpContext) {
    try {
      const provinceId = request.qs().province
      const { data } = await axios.get(`${BASE_URL}/destination/city/${provinceId}`, { headers: { key: API_KEY } })
      return response.status(200).send({ message: 'Success', serve: data?.data ?? data })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getDistrict({ response, request }: HttpContext) {
    try {
      const cityId = request.qs().city
      const { data } = await axios.get(`${BASE_URL}/destination/district/${cityId}`, { headers: { key: API_KEY } })
      return response.status(200).send({ message: 'Success', serve: data?.data ?? data })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getSubDistrict({ response, request }: HttpContext) {
    try {
      const districtId = request.qs().district
      const { data } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, { headers: { key: API_KEY } })
      return response.status(200).send({ message: 'Success', serve: data?.data ?? data })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async getCost({ request, response }: HttpContext) {
    try {
      // ===== destination =====
      // FE bisa kirim destination atau subdistrict/sub_district
      const destination = toInt(pickInput(request, ['destination', 'subdistrict', 'sub_district', 'subDistrict']), 0)

      // ===== weight =====
      const weight = Math.max(1, toInt(pickInput(request, ['weight'], 1), 1))

      // ===== origin + originType =====
      const originFromReq = pickInput(request, ['origin'])
      const origin = toInt(originFromReq ?? env.get('KOMERCE_ORIGIN'), 0)

      const originTypeFromReq = pickInput(request, ['origin_type', 'originType'])
      const originType = normalizeLocationType(originTypeFromReq ?? env.get('KOMERCE_ORIGIN_TYPE'), 'district')

      // ===== destinationType =====
      const destinationTypeFromReq = pickInput(request, ['destination_type', 'destinationType'])
      const destinationType = normalizeLocationType(destinationTypeFromReq ?? 'subdistrict', 'subdistrict')

      // ===== courier =====
      let courier = pickInput(request, ['courier'], 'jne')
      courier = cleanCourier(courier)

      // ===== price =====
      // "all" biar keluar semua layanan. kalau mau ringkas bisa "lowest"
      const price = String(pickInput(request, ['price'], 'all')).toLowerCase()

      const noCache = toInt(pickInput(request, ['no_cache', 'noCache'], 0), 0) === 1

      if (!BASE_URL || !API_KEY) {
        return response.status(500).send({
          message: 'KOMERCE config missing (KOMERCE_COST_BASE_URL / KOMERCE_COST_API_KEY).',
          serve: null,
        })
      }

      if (!origin || !destination) {
        return response.status(400).send({
          message: 'Origin/Destination invalid. Check KOMERCE_ORIGIN & destination id.',
          serve: null,
          meta: { origin, originType, destination, destinationType, weight, courier, price },
        })
      }

      // ===== cache key =====
      const cacheKey = JSON.stringify({ origin, originType, destination, destinationType, weight, courier, price })
      if (!noCache) {
        const cached = cacheGet(cacheKey)
        if (cached) {
          return response.status(200).send({
            message: 'Success',
            serve: cached,
            meta: { origin, originType, destination, destinationType, weight, courier, price, cached: true },
          })
        }
      }

      // ✅ FIX: kirim originType + destinationType, dan endpoint mengikuti originType
      const body = qs.stringify({
        origin,
        originType,
        destination,
        destinationType,
        weight,
        courier, // sudah koma-separated (multi courier bisa)
        price,
      })

      const endpoint = endpointForOriginType(originType)

      const { data } = await axios.post(`${BASE_URL}${endpoint}`, body, {
        headers: {
          key: API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
      })

      const result = data?.data ?? data

      if (!noCache) cacheSet(cacheKey, result)

      return response.status(200).send({
        message: 'Success',
        serve: result,
        meta: { origin, originType, destination, destinationType, weight, courier, price, cached: false },
      })
    } catch (e: any) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: e.response?.data || null,
      })
    }
  }
}
