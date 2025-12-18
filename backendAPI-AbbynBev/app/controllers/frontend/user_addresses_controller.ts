import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import UserAddress from '#models/user_address'
import axios from 'axios'
import db from '@adonisjs/lucid/services/db'
import qs from 'qs'

export default class UserAddressesController {
  public async list({ response, auth }: HttpContext) {
    try {
      const addresses = await UserAddress.query().where('user_id', auth.user?.id ?? 0)

      return response.status(200).send({
        message: 'Success',
        serve: addresses,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const provinceId = request.input('province')
      const cityId = request.input('city')
      const districtId = request.input('district')
      const subDistrictId = request.input('subdistrict')

      const { data: subDistrictData } = await axios.get(
        `${BASE_URL}/destination/sub-district/${districtId}`,
        { headers: { key: API_KEY } }
      )

      const subDistrict = (subDistrictData?.data as any[])?.find((s) => s.id == subDistrictId)

      if (!subDistrict) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Subdistrict not found',
          serve: null,
        })
      }

      const dataAddress = new UserAddress()
      dataAddress.address = request.input('address')
      dataAddress.isActive = request.input('is_active') ?? 1
      dataAddress.userId = auth.user?.id ?? 0
      dataAddress.province = provinceId
      dataAddress.city = cityId
      dataAddress.district = districtId
      dataAddress.subDistrict = subDistrictId
      dataAddress.picName = request.input('pic_name')
      dataAddress.picPhone = request.input('pic_phone')
      dataAddress.picLabel = request.input('pic_label')
      dataAddress.benchmark = request.input('benchmark')
      dataAddress.postalCode = subDistrict.zip_code

      await dataAddress.useTransaction(trx).save()
      await trx.commit()

      return response.status(200).send({
        message: 'Successfully created address.',
        serve: dataAddress,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal server error.',
        serve: null,
      })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
  const trx = await db.transaction();
  try {
    const id = request.input('id');
    const dataAddress = await UserAddress.query({ client: trx })
      .where('id', id)
      .where('user_id', auth.user?.id ?? 0)
      .first();

    if (!dataAddress) {
      await trx.rollback();
      return response.status(404).send({ message: 'Address not found.', serve: null });
    }

    const is_active    = request.input('is_active');
    const address      = request.input('address');
    const provinceId   = request.input('province');
    const cityId       = request.input('city');
    const districtId   = request.input('district');
    const subDistrictId= request.input('subdistrict');
    const postalCode   = request.input('postal_code');
    const picName      = request.input('pic_name');
    const picPhone     = request.input('pic_phone');
    const picLabel     = request.input('pic_label');
    const benchmark    = request.input('benchmark');
    const onlyToggle =
      typeof is_active !== 'undefined' &&
      typeof address === 'undefined' &&
      typeof provinceId === 'undefined' &&
      typeof cityId === 'undefined' &&
      typeof districtId === 'undefined' &&
      typeof subDistrictId === 'undefined' &&
      typeof postalCode === 'undefined' &&
      typeof picName === 'undefined' &&
      typeof picPhone === 'undefined' &&
      typeof picLabel === 'undefined' &&
      typeof benchmark === 'undefined';

    if (onlyToggle) {
      dataAddress.isActive = Number(is_active);
      await dataAddress.useTransaction(trx).save();
      await trx.commit();

      if (dataAddress.isActive === 2) {
        await UserAddress.query()
          .where('id', '!=', dataAddress.id)
          .where('user_id', auth.user?.id ?? 0)
          .where('is_active', 2)
          .update({ is_active: 1 });
      }

      return response.status(200).send({
        message: 'Successfully updated address (toggle).',
        serve: dataAddress,
      });
    }
    if (districtId || subDistrictId) {
      if (!districtId || !subDistrictId) {
        await trx.rollback();
        return response.status(400).send({
          message: 'District & subdistrict are required when updating location.',
          serve: null,
        });
      }
      const { data: subDistrictData } = await axios.get(
        `${BASE_URL}/destination/sub-district/${districtId}`,
        { headers: { key: API_KEY } }
      );
      const subDistrict = (subDistrictData?.data as any[])?.find((s) => s.id == subDistrictId);
      if (!subDistrict) {
        await trx.rollback();
        return response.status(400).send({
          message: 'Subdistrict not found. Please update your address.',
          serve: null,
        });
      }
      dataAddress.district = districtId;
      dataAddress.subDistrict = subDistrictId;
      dataAddress.postalCode = subDistrict.zip_code || postalCode || dataAddress.postalCode;
    }

    if (typeof is_active !== 'undefined') dataAddress.isActive = Number(is_active);
    if (typeof address !== 'undefined') dataAddress.address = address;
    if (typeof provinceId !== 'undefined') dataAddress.province = provinceId;
    if (typeof cityId !== 'undefined') dataAddress.city = cityId;
    if (typeof picName !== 'undefined') dataAddress.picName = picName;
    if (typeof picPhone !== 'undefined') dataAddress.picPhone = picPhone;
    if (typeof picLabel !== 'undefined') dataAddress.picLabel = picLabel;
    if (typeof benchmark !== 'undefined') dataAddress.benchmark = benchmark;

    await dataAddress.useTransaction(trx).save();
    await trx.commit();

    if (dataAddress.isActive === 2) {
      await UserAddress.query()
        .where('id', '!=', dataAddress.id)
        .where('user_id', auth.user?.id ?? 0)
        .where('is_active', 2)
        .update({ is_active: 1 });
    }

    return response.status(200).send({
      message: 'Successfully updated address.',
      serve: dataAddress,
    });
  } catch (error) {
    await trx.rollback();
    return response.status(500).send({
      message: error.message || 'Internal server error.',
      serve: null,
    });
  }
}

  public async delete({ response, request }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataAddress = await UserAddress.query().where('id', request.input('id')).first()
      if (!dataAddress) {
        return response.status(404).send({
          message: 'Address not found.',
          serve: [],
        })
      }
      await dataAddress.delete()
      await trx.commit()

      return response.status(200).send({
        message: 'Successfully deleted address.',
        serve: [],
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal server error.',
        serve: [],
      })
    }
  }

  public async getProvince({ response }: HttpContext) {
    try {
      const { data } = await axios.get(`${BASE_URL}/destination/province`, {
        headers: { key: API_KEY },
      })

      return response.status(200).send({
        message: 'Success',
        serve: data?.data ?? data,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async getCity({ response, request }: HttpContext) {
    try {
      const provinceId = request.qs().province
      const { data } = await axios.get(`${BASE_URL}/destination/city/${provinceId}`, {
        headers: { key: API_KEY },
      })

      return response.status(200).send({
        message: 'Success',
        serve: data?.data ?? data,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async getDistrict({ response, request }: HttpContext) {
    try {
      const cityId = request.qs().city
      const { data } = await axios.get(`${BASE_URL}/destination/district/${cityId}`, {
        headers: { key: API_KEY },
      })

      return response.status(200).send({
        message: 'Success',
        serve: data?.data ?? data,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async getSubDistrict({ response, request }: HttpContext) {
    try {
      const districtId = request.qs().district
      const { data } = await axios.get(`${BASE_URL}/destination/sub-district/${districtId}`, {
        headers: { key: API_KEY },
      })

      return response.status(200).send({
        message: 'Success',
        serve: data?.data ?? data,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async getCost({ request, response }: HttpContext) {
    try {
      const destination = request.input('destination')
      const weight = request.input('weight')
      const courier = request.input('courier') || 'jne'
      const price = request.input('price') || 'lowest'
      const body = qs.stringify({
        origin: Number(env.get('KOMERCE_ORIGIN')),
        destination: Number(destination),
        weight: Number(weight),
        courier: courier.replace(/:/g, ','),
        price,
      })

      const { data } = await axios.post(`${BASE_URL}/calculate/district/domestic-cost`, body, {
        headers: {
          'key': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json',
        },
      })

      return response.status(200).send({
        message: 'Success',
        serve: data?.data ?? data,
      })
    } catch (e) {
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: e.response?.data || null,
      })
    }
  }
}

const BASE_URL = env.get('KOMERCE_COST_BASE_URL')
const API_KEY = env.get('KOMERCE_COST_API_KEY')
