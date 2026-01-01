// app/services/address/user_address_service.ts
import db from '@adonisjs/lucid/services/db'
import UserAddress from '#models/user_address'
import HttpHelper from '../../utils/http.js'
import PostalHelper from '../../utils/postal.js'

type UpsertPayload = {
  id?: number
  area?: any
  area_id?: any
  areaId?: any
  biteship_area_id?: any
  biteshipAreaId?: any

  area_name?: any
  areaName?: any
  biteship_area_name?: any
  biteshipAreaName?: any

  postal_code?: any
  postalCode?: any

  address?: any
  pic_name?: any
  picName?: any
  pic_phone?: any
  picPhone?: any
  pic_label?: any
  picLabel?: any
  benchmark?: any

  is_active?: any
  isActive?: any
}

function parseArea(payload: UpsertPayload) {
  const areaObj = payload.area
  const areaIdIn =
    payload.area_id ?? payload.areaId ?? payload.biteship_area_id ?? payload.biteshipAreaId ?? ''
  const areaNameIn =
    payload.area_name ?? payload.areaName ?? payload.biteship_area_name ?? payload.biteshipAreaName ?? ''

  const areaId = String(areaObj?.id ?? areaIdIn ?? '').trim()
  const areaName = String(areaObj?.name ?? areaNameIn ?? '').trim()

  const postalFromArea = areaObj?.postal_code ?? areaObj?.postalCode
  const postalIn = payload.postal_code ?? payload.postalCode
  const postalCode = PostalHelper.normalizePostal(postalFromArea ?? postalIn ?? '')

  return { areaId, areaName, postalCode }
}

export class UserAddressService {
  async list(userId: number) {
    return UserAddress.query().where('user_id', userId)
  }

  async create(userId: number, payload: UpsertPayload) {
    return db.transaction(async (trx) => {
      const { areaId, areaName, postalCode } = parseArea(payload)

      if (!areaId) {
        const err: any = new Error('area_id is required (pilih dari hasil /areas).')
        err.httpStatus = 400
        throw err
      }

      if (postalCode && !PostalHelper.isPostalCode(postalCode)) {
        const err: any = new Error('postal_code must be 5 digit.')
        err.httpStatus = 400
        throw err
      }

      const isActive = HttpHelper.toInt(payload.is_active ?? payload.isActive ?? 1, 1)

      const addr = new UserAddress()
      addr.userId = userId
      addr.isActive = isActive

      // legacy dropdown kosong
      addr.province = null
      addr.city = null
      addr.district = null
      addr.subDistrict = null

      // biteship
      addr.biteshipAreaId = areaId
      addr.biteshipAreaName = areaName || ''
      addr.postalCode = postalCode || ''

      addr.address = String(payload.address ?? '')
      addr.picName = String(payload.pic_name ?? payload.picName ?? '')
      addr.picPhone = String(payload.pic_phone ?? payload.picPhone ?? '')
      addr.picLabel = String(payload.pic_label ?? payload.picLabel ?? '')
      addr.benchmark = String(payload.benchmark ?? '')

      await addr.useTransaction(trx).save()

      // kalau jadi default (2), set yang lain jadi non-default (1)
      if (addr.isActive === 2) {
        await UserAddress.query({ client: trx })
          .where('user_id', userId)
          .where('id', '!=', addr.id)
          .where('is_active', 2)
          .update({ is_active: 1 })
      }

      return addr
    })
  }

  async update(userId: number, payload: UpsertPayload) {
    return db.transaction(async (trx) => {
      const id = HttpHelper.toInt(payload.id, 0)
      if (!id) {
        const err: any = new Error('id is required')
        err.httpStatus = 400
        throw err
      }

      const addr = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', userId)
        .first()

      if (!addr) {
        const err: any = new Error('Address not found.')
        err.httpStatus = 404
        throw err
      }

      const { areaId, areaName, postalCode } = parseArea(payload)

      if (areaId) {
        addr.biteshipAreaId = areaId
        addr.biteshipAreaName = areaName || addr.biteshipAreaName || ''
      }

      if (typeof payload.is_active !== 'undefined' || typeof payload.isActive !== 'undefined') {
        addr.isActive = HttpHelper.toInt(payload.is_active ?? payload.isActive, addr.isActive)
      }

      if (typeof payload.address !== 'undefined') addr.address = String(payload.address)
      if (typeof payload.pic_name !== 'undefined' || typeof payload.picName !== 'undefined') {
        addr.picName = String(payload.pic_name ?? payload.picName)
      }
      if (typeof payload.pic_phone !== 'undefined' || typeof payload.picPhone !== 'undefined') {
        addr.picPhone = String(payload.pic_phone ?? payload.picPhone)
      }
      if (typeof payload.pic_label !== 'undefined' || typeof payload.picLabel !== 'undefined') {
        addr.picLabel = String(payload.pic_label ?? payload.picLabel)
      }
      if (typeof payload.benchmark !== 'undefined') addr.benchmark = String(payload.benchmark)

      // postal optional tapi kalau dikirim harus valid
      if (typeof payload.postal_code !== 'undefined' || typeof payload.postalCode !== 'undefined' || postalCode) {
        if (postalCode && !PostalHelper.isPostalCode(postalCode)) {
          const err: any = new Error('postal_code must be 5 digit.')
          err.httpStatus = 400
          throw err
        }
        if (typeof postalCode !== 'undefined') addr.postalCode = postalCode || ''
      }

      await addr.useTransaction(trx).save()

      if (addr.isActive === 2) {
        await UserAddress.query({ client: trx })
          .where('user_id', userId)
          .where('id', '!=', addr.id)
          .where('is_active', 2)
          .update({ is_active: 1 })
      }

      return addr
    })
  }

  async delete(userId: number, id: number) {
    return db.transaction(async (trx) => {
      if (!id) {
        const err: any = new Error('id is required')
        err.httpStatus = 400
        throw err
      }

      const addr = await UserAddress.query({ client: trx })
        .where('id', id)
        .where('user_id', userId)
        .first()

      if (!addr) {
        const err: any = new Error('Address not found.')
        err.httpStatus = 404
        throw err
      }

      await addr.useTransaction(trx).delete()
      return true
    })
  }
}
