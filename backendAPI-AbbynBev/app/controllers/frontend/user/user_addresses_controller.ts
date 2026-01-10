// app/controllers/frontend/user_addresses_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

import HttpHelper from '../../../utils/http.js'
import PostalHelper from '../../../utils/postal.js'

import { UserAddressService } from '#services/address/user_address_service'
import { BiteshipClient } from '#services/address/biteship_client'

import env from '#start/env'
import UserAddress from '#models/user_address'

export default class UserAddressesController {
  private addressSvc = new UserAddressService()
  private biteship = new BiteshipClient()

  public async list({ response, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const addresses = await this.addressSvc.list(userId)
      return response.status(200).send({ message: 'Success', serve: addresses })
    } catch (e: any) {
      return response
        .status(500)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const payload = request.all()
      const created = await this.addressSvc.create(userId, payload)
      return response.status(200).send({ message: 'Successfully created address.', serve: created })
    } catch (e: any) {
      const status = e?.httpStatus || 500
      return response
        .status(status)
        .send({ message: e.message || 'Internal server error.', serve: null })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const payload = request.all()
      const updated = await this.addressSvc.update(userId, payload)
      return response.status(200).send({ message: 'Successfully updated address.', serve: updated })
    } catch (e: any) {
      const status = e?.httpStatus || 500
      return response
        .status(status)
        .send({ message: e.message || 'Internal server error.', serve: null })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    try {
      const userId = auth.user?.id ?? 0
      const id = HttpHelper.toInt(HttpHelper.pickInput(request, ['id'], 0), 0)
      await this.addressSvc.delete(userId, id)
      return response.status(200).send({ message: 'Successfully deleted address.', serve: [] })
    } catch (e: any) {
      const status = e?.httpStatus || 500
      return response
        .status(status)
        .send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async searchAreas({ request, response }: HttpContext) {
    try {
      const input = String(request.qs().input || '').trim()
      const countries = String(request.qs().countries || 'ID').trim()
      const type = String(request.qs().type || 'multi').trim()

      const {
        data: areas,
        cached,
        coalesced,
      } = await this.biteship.searchAreas({ input, countries, type })

      return response.status(200).send({
        message: 'Success',
        serve: areas,
        meta: { cached, coalesced: !!coalesced },
      })
    } catch (e: any) {
      const { status, body, msg, code } = BiteshipClient.extractError(e)
      return response.status(e?.httpStatus || status).send({
        message: code
          ? `${msg || e.message} (code: ${code})`
          : msg || e.message || 'Internal Server Error',
        serve: body || null,
      })
    }
  }

  public async getCost({ request, response, auth }: HttpContext) {
    let payloadUsed: any = null

    try {
      const addressId = HttpHelper.toInt(
        HttpHelper.pickInput(request, ['address_id', 'addressId'], 0),
        0
      )

      let destinationAreaId = String(
        HttpHelper.pickInput(request, ['destination_area_id', 'destinationAreaId'], '') || ''
      ).trim()
      let destinationPostal = PostalHelper.normalizePostal(
        HttpHelper.pickInput(
          request,
          ['destination_postal_code', 'destinationPostalCode', 'postal_code', 'postalCode'],
          ''
        ) || ''
      )

      if (addressId) {
        const addr = await UserAddress.query()
          .where('id', addressId)
          .where('user_id', auth.user?.id ?? 0)
          .first()

        if (!addr) return response.status(404).send({ message: 'Address not found.', serve: null })

        if (addr.biteshipAreaId) destinationAreaId = String(addr.biteshipAreaId).trim()
        if (addr.postalCode) destinationPostal = PostalHelper.normalizePostal(addr.postalCode)
      }

      const originAreaId = String(env.get('BITESHIP_ORIGIN_AREA_ID') || '').trim()
      const originPostal = String(env.get('COMPANY_POSTAL_CODE') || '').trim()

      const weight = Math.max(1, HttpHelper.toInt(HttpHelper.pickInput(request, ['weight'], 1), 1))
      const value = Math.max(
        1,
        HttpHelper.toInt(HttpHelper.pickInput(request, ['value', 'amount', 'total'], 1000), 1000)
      )
      const quantity = Math.max(
        1,
        HttpHelper.toInt(HttpHelper.pickInput(request, ['quantity', 'qty'], 1), 1)
      )

      const couriers = BiteshipClient.normalizeCouriers(
        String(HttpHelper.pickInput(request, ['courier', 'couriers'], 'all'))
      )

      const payload: any = {
        couriers,
        items: [{ name: 'Order', description: 'Ecommerce order', value, quantity, weight }],
      }

      if (originAreaId && destinationAreaId) {
        payload.origin_area_id = originAreaId
        payload.destination_area_id = destinationAreaId
      } else {
        if (!PostalHelper.isPostalCode(originPostal)) {
          return response.status(500).send({
            message:
              'Origin not configured. Set BITESHIP_ORIGIN_AREA_ID or valid COMPANY_POSTAL_CODE.',
            serve: null,
            meta: { originAreaId: originAreaId || null, originPostal: originPostal || null },
          })
        }

        if (!PostalHelper.isPostalCode(destinationPostal)) {
          return response.status(400).send({
            message:
              'Destination invalid. Provide destination_area_id OR destination_postal_code (or save postalCode in address).',
            serve: null,
            meta: {
              destinationAreaId: destinationAreaId || null,
              destinationPostal: destinationPostal || null,
            },
          })
        }

        payload.origin_postal_code = HttpHelper.toInt(originPostal, 0)
        payload.destination_postal_code = HttpHelper.toInt(destinationPostal, 0)
      }

      payloadUsed = payload

      const noCache =
        HttpHelper.toInt(HttpHelper.pickInput(request, ['no_cache', 'noCache'], 0), 0) === 1
      const result = await this.biteship.getCourierRates(payload, noCache)

      return response.status(200).send({
        message: 'Success',
        serve: result.data,
        meta: {
          cached: (result as any).cached ?? false,
          coalesced: !!(result as any).coalesced,
          noCache: !!(result as any).noCache,
          payload: payloadUsed,
        },
      })
    } catch (e: any) {
      const { status, body, msg, code } = BiteshipClient.extractError(e)
      return response.status(e?.httpStatus || status).send({
        message: code
          ? `${msg || e.message} (code: ${code})`
          : msg || e.message || 'Internal Server Error',
        serve: body || null,
        meta: { payload: payloadUsed || null, biteship: { status, code: code || null } },
      })
    }
  }
}
