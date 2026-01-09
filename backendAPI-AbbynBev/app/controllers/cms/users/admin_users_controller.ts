import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUser, updateUser } from '#validators/user'
import { Role } from '../../../enums/role.js'
import { ActivityLogService } from '#services/activity_log_service'
import { UserRepository } from '#services/user/user_repository'

export default class AdminUsersController {
  private userRepo = new UserRepository()

  public async getAdmin({ response, request }: HttpContext) {
    try {
      const qs = request.qs()
      const search = qs.q ?? ''
      const role = qs.role ?? ''
      const page = Number.isNaN(Number.parseInt(qs.page)) ? 1 : Number.parseInt(qs.page)
      const perPage = Number.isNaN(Number.parseInt(qs.per_page)) ? 10 : Number.parseInt(qs.per_page)

      const guestRole = Role?.GUEST ?? 2

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .whereNot('role', guestRole)
        .if(search, (q) =>
          q.where('firstName', 'like', `%${search}%`).orWhere('lastName', 'like', `%${search}%`)
        )
        .if(role, (q) => q.where('role', role))
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      const meta = users.toJSON().meta

      return response.status(200).send({
        message: 'success',
        serve: { data: users.toJSON().data, ...meta },
      })
    } catch (error) {
      return response.status(500).send({ message: 'Internal server error.', serve: [] })
    }
  }

  public async list({ response, request }: HttpContext) {
    try {
      const qs = request.qs()
      const search = qs.q ?? ''

      const users = await User.query()
        .apply((scopes) => scopes.active())
        .where('role', Role.GUEST)
        .if(search, (q) =>
          q.where('firstName', 'like', `%${search}%`).orWhere('lastName', 'like', `%${search}%`)
        )
        .orderBy('first_name', 'asc')

      return response.status(200).send({ message: 'success', serve: users })
    } catch (error) {
      return response.status(500).send({ message: 'Internal server error.', serve: [] })
    }
  }

  public async createAdmin({ response, request, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUser)

      const user = await User.create({
        ...payload,
        createdBy: auth.user?.id,
        updatedBy: auth.user?.id,
      })

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: user.toJSON(),
      })

      return response.status(201).send({ message: 'Success', serve: user })
    } catch (e: any) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async showAdmin({ response, params }: HttpContext) {
    try {
      const user = await this.userRepo.findActiveById(params.id)
      if (!user) return response.status(404).send({ message: 'User not found', serve: null })
      return response.status(200).send({ message: 'Success', serve: user })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async updateAdmin({ response, params, request, auth }: HttpContext) {
    try {
      const { password, ...restPayload } = await request.validateUsing(updateUser)

      const user = await this.userRepo.findActiveById(params.id)
      if (!user) return response.status(404).send({ message: 'User not found', serve: null })

      const oldData = user.toJSON()

      const data: any = { ...restPayload }
      if (password) data.password = password

      user.merge({
        ...data,
        gender: data.gender ? Number(data.gender) : null,
        updatedBy: auth.user?.id,
      })

      await user.save()

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: { old: oldData, new: user.toJSON() },
      })

      return response.status(200).send({ message: 'Success', serve: user })
    } catch (e: any) {
      if (e.status === 422) {
        return response.status(422).send({
          message:
            e.messages?.length > 0
              ? e.messages.map((v: { message: string }) => v.message).join(',')
              : 'Validation error.',
          serve: e.messages,
        })
      }
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }

  public async deleteAdmin({ response, params, auth }: HttpContext) {
    try {
      const user = await this.userRepo.findActiveById(params.id)
      if (!user) return response.status(404).send({ message: 'User not found', serve: null })

      const now = Date.now()
      const [userMail, domain] = user.email.split('@')
      user.email = `${userMail}_${now}@${domain}`
      await user.softDelete()

      await ActivityLogService.log({
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Delete Admin ${auth.user?.name}`,
        menu: 'Admin',
        data: user.toJSON(),
      })

      return response.status(200).send({ message: 'Success', serve: true })
    } catch (e: any) {
      return response.status(500).send({ message: e.message || 'Internal Server Error', serve: null })
    }
  }
}
