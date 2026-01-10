import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'

export default class SettingCmsController {
  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const name = queryString.name ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataSetting = await Setting.query()
        .apply((scopes) => scopes.active())
        .if(name, (query) => {
          query.where('key', 'like', `%${name}%`)
        })
        .orderBy('created_at', 'desc')
        .paginate(page, per_page)

      const meta = dataSetting.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataSetting?.toJSON().data,
          ...meta,
        },
      })
    } catch (error) {
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async create({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataSetting = new Setting()
      dataSetting.key = request.input('key')
      dataSetting.value = request.input('value')
      dataSetting.group = request.input('group')
      await dataSetting.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Setting`,
        menu: 'Setting',
        data: dataSetting.toJSON(),
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully created.',
        serve: dataSetting,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async update({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataSetting = await Setting.query().where('id', request.input('id')).first()
      if (!dataSetting) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      const oldData = dataSetting.toJSON()

      dataSetting.value = request.input('value')
      dataSetting.group = request.input('group')
      await dataSetting.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Setting`,
        menu: 'Setting',
        data: { old: oldData, new: dataSetting.toJSON() },
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully updated.',
        serve: dataSetting,
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async delete({ response, request, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const setting = await Setting.query().where('id', request.input('id')).first()
      if (setting) {
        await setting.softDelete()

        // @ts-ignore
        await emitter.emit('set:activity-log', {
          roleName: auth.user?.role_name,
          userName: auth.user?.name,
          activity: `Delete Setting`,
          menu: 'Setting',
          data: setting.toJSON(),
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
        message: 'Internal server error.',
        serve: [],
      })
    }
  }
}
