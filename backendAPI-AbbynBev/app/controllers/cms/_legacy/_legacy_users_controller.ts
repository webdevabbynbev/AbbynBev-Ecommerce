import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUser, updateUser } from '#validators/user'
import { Role } from '../../enums/role.js'
import emitter from '@adonisjs/core/services/emitter'
import { UserRepository } from '#services/user/user_repository'


export default class UsersController {
  private userRepo = new UserRepository()
  public async getCustomers({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const search = queryString.q ?? ''
      const page = Number.isNaN(Number.parseInt(queryString.page))
        ? 1
        : Number.parseInt(queryString.page)
      const perPage = Number.isNaN(Number.parseInt(queryString.per_page))
        ? 10
        : Number.parseInt(queryString.per_page)

      const guestRole = Role?.GUEST ?? 2

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .where('role', guestRole)
        .if(search, (query) =>
          query.where('firstName', 'like', `%${search}%`).orWhere('lastName', 'like', `%${search}%`)
        )
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      const meta = users.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: {
          data: users?.toJSON().data,
          ...meta,
        },
      })
    } catch (error) {
      console.error('Error in customers:', error)
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async getAdmin({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const search = queryString.q ?? ''
      const role = queryString.role ?? ''

      const page = Number.isNaN(Number.parseInt(queryString.page))
        ? 1
        : Number.parseInt(queryString.page)
      const perPage = Number.isNaN(Number.parseInt(queryString.per_page))
        ? 10
        : Number.parseInt(queryString.per_page)

      const guestRole = Role?.GUEST ?? 2

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .whereNot('role', guestRole)
        .if(search, (query) =>
          query.where('firstName', 'like', `%${search}%`).orWhere('lastName', 'like', `%${search}%`)
        )
        .if(role, (query) => query.where('role', role))
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      const meta = users.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: {
          data: users?.toJSON().data,
          ...meta,
        },
      })
    } catch (error) {
      console.error('Error in index:', error)
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async list({ response, request }: HttpContext) {
    try {
      const queryString = request.qs()
      const search = queryString.q ?? ''

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .where('role', Role.GUEST)
        .if(search, (query) => query.where('name', 'like', `%${search}%`))
        .orderBy('name', 'asc')

      return response.status(200).send({
        message: 'success',
        serve: users,
      })
    } catch (error) {
      return response.status(500).send({
        message: 'Internal server error.',
        serve: [],
      })
    }
  }

  public async createAdmin({ response, request, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUser)
      const user: User = await User.create({
        ...payload,
        createdBy: auth.user?.id,
        updatedBy: auth.user?.id,
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: user.toJSON(),
      })

      return response.status(201).send({
        message: 'Success',
        serve: user,
      })
    } catch (e) {
      console.error('Error in store:', e)
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }

      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async showAdmin({ response, params }: HttpContext) {
    try {
      const { id } = params
      const user: User | null = await this.userRepo.findActiveById(id)


      if (!user) {
        return response.status(404).send({
          message: 'User not found',
          serve: null,
        })
      }

      return response.status(200).send({
        message: 'Success',
        serve: user,
      })
    } catch (e) {
      console.error('Error in show:', e)
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async updateAdmin({ response, params, request, auth }: HttpContext) {
    try {
      const { id } = params
      const { password, ...restPayload } = await request.validateUsing(updateUser)

      const user: User | null = await this.userRepo.findActiveById(id)

      if (!user) {
        return response.status(404).send({
          message: 'User not found',
          serve: null,
        })
      }

      const oldData = user.toJSON()

      const data = {
        ...restPayload,
      }

      if (password) {
        Object.assign(data, {
          password: password,
        })
      }

      // @ts-ignore
      user.merge({
        ...data,
        gender: data.gender ? Number(data.gender) : null,
        updatedBy: auth.user?.id,
      })

      await user.save()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: { old: oldData, new: user.toJSON() },
      })

      return response.status(200).send({
        message: 'Success',
        serve: user,
      })
    } catch (e) {
      console.error('Error in update:', e)
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages?.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }

      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async deleteAdmin({ response, params, auth }: HttpContext) {
    try {
      const { id } = params
      const user: User | null = await this.userRepo.findActiveById(id)


      if (!user) {
        return response.status(404).send({
          message: 'User not found',
          serve: null,
        })
      }

      const now = new Date().getTime()
      const [userMail, email] = user.email.split('@')

      user.email = `${userMail}_${now}@${email}`
      await user.softDelete()

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: user.toJSON(),
      })

      return response.status(200).send({
        message: 'Success',
        serve: true,
      })
    } catch (e) {
      console.error('Error in delete:', e)
      return response.status(500).send({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
