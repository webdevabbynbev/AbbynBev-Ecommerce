import Attribute from '#models/attribute'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { create } from '#validators/attribute'
import AttributeValue from '#models/attribute_value'
import emitter from '@adonisjs/core/services/emitter'

export default class AttributesController {
  public async get({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const name = queryString.name ?? ''
      const page = isNaN(parseInt(queryString.page)) ? 1 : parseInt(queryString.page)
      const per_page = isNaN(parseInt(queryString.per_page)) ? 10 : parseInt(queryString.per_page)

      const dataAttribute = await Attribute.query()
        .apply((scopes) => scopes.active())
        .if(name, (query) => {
          query.where('attributes.name', 'like', `%${name}%`)
        })
        .preload('values')
        .orderBy('attributes.created_at', 'desc')
        .paginate(page, per_page)

      const meta = dataAttribute.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataAttribute?.toJSON().data,
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

  public async list({ response }: HttpContext) {
    try {
      const dataAttribute = await Attribute.query()
        .apply((scopes) => scopes.active())
        .preload('values')
        .orderBy('attributes.name', 'asc')

      return response.status(200).send({
        message: 'success',
        serve: dataAttribute,
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

      const dataAttribute = new Attribute()
      dataAttribute.name = request.input('name')
      await dataAttribute.save()

      if (request.input('values')?.length > 0) {
        for (const value of request.input('values')) {
          await AttributeValue.create({
            value: value,
            attributeId: dataAttribute.id,
          })
        }
      }

      await dataAttribute.load('values')

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Attribute`,
        menu: 'Attribute',
        data: dataAttribute.toJSON(),
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully created.',
        serve: dataAttribute,
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

      const dataAttribute = await Attribute.query().where('id', request.input('id')).first()
      if (!dataAttribute) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      const oldData = dataAttribute.toJSON()

      dataAttribute.name = request.input('name')
      await dataAttribute.save()

      if (request.input('values')?.length > 0) {
        await AttributeValue.query().where('attribute_id', dataAttribute.id).delete()
        for (const value of request.input('values')) {
          await AttributeValue.create({
            value: value,
            attributeId: dataAttribute.id,
          })
        }
      }

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Attribute`,
        menu: 'Attribute',
        data: { old: oldData, new: dataAttribute.toJSON() },
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully updated.',
        serve: dataAttribute,
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
      const attribute = await Attribute.query().where('id', request.input('id')).first()
      if (attribute) {
        await attribute.delete()

        // @ts-ignore
        await emitter.emit('set:activity-log', {
          roleName: auth.user?.role_name,
          userName: auth.user?.name,
          activity: `Delete Attribute`,
          menu: 'Attribute',
          data: attribute.toJSON(),
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

  public async addValue({ response, request, params }: HttpContext) {
    const trx = await db.transaction()
    try {
      const dataAttribute = await Attribute.query().where('id', params.attribute_id).first()
      if (!dataAttribute) {
        return response.status(400).send({
          message: 'Invalid data.',
          serve: [],
        })
      }

      await AttributeValue.create({
        value: request.input('value'),
        attributeId: dataAttribute.id,
      })

      await trx.commit()
      return response.status(200).send({
        message: 'Sucessfully created.',
        serve: dataAttribute,
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
