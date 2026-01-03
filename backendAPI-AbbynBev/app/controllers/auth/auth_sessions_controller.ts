import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import env from '#start/env'
import vine from '@vinejs/vine'
import { OAuth2Client } from 'google-auth-library'

import { Role } from '../../enums/role.js'
import { badRequest, badRequest400, internalError } from '../../utils/response.js'

import AuthLoginService from '#services/auth/auth_login_service'
import { login as loginValidator } from '#validators/auth'

export default class AuthSessionsController {
  public async loginCashier({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const result = await AuthLoginService.loginCashier(email, password)

      if (!result.ok) return badRequest(response, result.message)
      return response.ok(result.payload)
    } catch (error) {
      return internalError(response, error)
    }
  }

  public async loginAdmin({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const result = await AuthLoginService.loginAdmin(email, password)

      if (!result.ok) {
        const fn = result.errorType === 'badRequest400' ? badRequest400 : badRequest
        return fn(response, result.message)
      }

      return response.ok(result.payload)
    } catch (error) {
      return internalError(response, error)
    }
  }

  /**
   * ✅ LOGIN CUSTOMER TANPA OTP
   * - Hanya register yang pakai OTP.
   * - Endpoint verify-login dinonaktifkan.
   */
  public async login({ request, response }: HttpContext) {
    try {
      const { email_or_phone, password } = await request.validateUsing(loginValidator)
      const rememberMe = Boolean(request.input('remember_me'))

      const result = await AuthLoginService.loginCustomer(email_or_phone, password, rememberMe)
      if (!result.ok) return badRequest(response, result.message)

      return response.ok(result.payload)
    } catch (error) {
      console.error(error)
      return internalError(response, error)
    }
  }

  /**
   * ❌ DISABLE: verify login OTP
   * (Biar route lama tidak error, tapi flow OTP login udah dimatiin)
   */
  public async verifyLoginOtp({ response }: HttpContext) {
    return response.badRequest({
      message: 'OTP login is disabled. Please use /auth/login (no OTP).',
      serve: null,
    })
  }

  public async logout({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.status(401).send('Unauthorized')

    const token = await user.currentAccessToken
    await User.accessTokens.delete(user, token.identifier)

    return response.status(200).send({
      message: 'Logged out successfully.',
      serve: true,
    })
  }

  public async loginGoogle({ response, request }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        token: vine.string(),
      })
    )

    const googleClient = new OAuth2Client()

    try {
      const { token } = await request.validateUsing(validator)

      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.get('GOOGLE_CLIENT_ID'),
      })

      const googlePayload = ticket.getPayload()
      const email = googlePayload?.email?.toLowerCase()
      const name = googlePayload?.name
      const googleId = googlePayload?.sub

      if (!email || !name || !googleId) {
        return response.badRequest({ message: 'Bad Request', serve: null })
      }

      const firstName = name.split(' ')[0] || ''
      const lastName = name.split(' ').slice(1).join(' ') || ''

      let user = await User.findColumnWithSoftDelete('email', email)

      if (!user) {
        user = await User.create({
          email,
          firstName,
          lastName,
          googleId,
          isActive: 1,
          role: Role.GUEST,
          password: 'randomPassword',
        })
      }

      if (user) {
        if (!user.googleId) user.googleId = googleId
        await user.save()
      }

      if (user.isActive !== 1) {
        return response.badRequest({ message: 'Account suspended', serve: null })
      }

      const tokenLogin = await this.generateToken(user)

      return response.ok({
        message: 'Ok',
        serve: {
          data: user.serialize({
            fields: [
              'id',
              'firstName',
              'lastName',
              'email',
              'gender',
              'address',
              'phoneNumber',
              'dob',
              'photoProfile',
              'role',
              'createdAt',
              'updatedAt',
            ],
          }),
          token: tokenLogin,
        },
      })
    } catch (e: any) {
      return response.internalServerError({
        message: e.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  private async generateToken(user: User): Promise<string> {
    const token = await User.accessTokens.create(user)
    return token.value!.release()
  }
}
