import Voucher from '#models/voucher'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { create } from '#validators/voucher'
import emitter from '@adonisjs/core/services/emitter'

export default class VouchersController {
  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const name = queryString.name ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataVoucher = await Voucher.query()
        .apply((scopes) => scopes.active())
        .if(name, (query) => {
          query.where('name', 'like', `%${name}%`)
        })
        .orderBy('created_at', 'desc')
        .paginate(page, per_page)

      const meta = dataVoucher.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataVoucher?.toJSON().data,
          ...meta,
        },
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const data = request.all()
      try {
        await create.validate(data)
      } catch (err) {
        await trx.commit()
        return response.status(422).send({
          message:
            err.messages?.length > 0
              ? err.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: [],
        })
      }

      const dataVoucher = new Voucher()
      dataVoucher.name = request.input('name')
      dataVoucher.code = request.input('code')
      dataVoucher.price = request.input('price')
      dataVoucher.isActive = request.input('is_active')
      dataVoucher.type = request.input('type')
      dataVoucher.qty = request.input('qty')
      dataVoucher.expiredAt = request.input('expired_at')
      dataVoucher.startedAt = request.input('started_at')
      dataVoucher.maxDiscPrice = request.input('max_disc_price')
      dataVoucher.percentage = request.input('percentage')
      dataVoucher.isPercentage = request.input('is_percentage')
      await dataVoucher.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Voucher ${dataVoucher.name}`,
        menu: 'Voucher',
        data: dataVoucher.toJSON(),
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully created.',
        serve: dataVoucher,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const data = request.all()
      try {
        await create.validate(data)
      } catch (err) {
        await trx.commit()
        return response.status(422).send({
          message:
            err.messages?.length > 0
              ? err.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: [],
        })
      }

      const dataVoucher = await Voucher.query().where('id', request.input('id')).first()
      if (!dataVoucher) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      const oldData = dataVoucher

      dataVoucher.name = request.input('name')
      dataVoucher.code = request.input('code')
      dataVoucher.price = request.input('price')
      dataVoucher.isActive = request.input('is_active')
      dataVoucher.type = request.input('type')
      dataVoucher.qty = request.input('qty')
      dataVoucher.expiredAt = request.input('expired_at')
      dataVoucher.startedAt = request.input('started_at')
      dataVoucher.maxDiscPrice = request.input('max_disc_price')
      dataVoucher.percentage = request.input('percentage')
      dataVoucher.isPercentage = request.input('is_percentage')
      await dataVoucher.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Voucher ${oldData.name}`,
        menu: 'Voucher',
        data: { old: oldData, new: dataVoucher.toJSON() },
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully updated.',
        serve: dataVoucher,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const voucher = await Voucher.query().where('id', request.input('id')).first()
      if (voucher) {
        await voucher.softDelete()

        // @ts-ignore
        await emitter.emit('set:activity-log', {
          roleName: auth.user?.role_name,
          userName: auth.user?.name,
          activity: `Delete Voucher ${voucher.name}`,
          menu: 'Voucher',
          data: voucher.toJSON(),
        })

        await trx.commit()
        return response.status(200).send({
          message: 'Successfully deleted.',
          serve: [],
        })
      } else {
        await trx.commit()
        return response.status(422).send({
          message: 'Invalid data.',
          serve: [],
        })
      }
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateStatus({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataVoucher = await Voucher.query().where('id', request.input('id')).first()
      if (!dataVoucher) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      dataVoucher.isActive = request.input('status')
      await dataVoucher.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Status Voucher ${dataVoucher.name}`,
        menu: 'Voucher',
        data: dataVoucher.toJSON(),
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully updated.',
        serve: dataVoucher,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }
}
