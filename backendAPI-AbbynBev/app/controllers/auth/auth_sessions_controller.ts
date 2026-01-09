import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import env from '#start/env'
import vine from '@vinejs/vine'
import { OAuth2Client } from 'google-auth-library'
import { randomBytes } from 'node:crypto'

import { Role } from '../../enums/role.js'
import { badRequest, badRequest400, internalError } from '../../utils/response.js'

import AuthLoginService from '#services/auth/auth_login_service'
import { login as loginValidator } from '#validators/auth'
import { UserRepository } from '#services/user/user_repository'

export default class AuthSessionsController {
  private userRepo = new UserRepository()

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

  private needsProfileCompletion(user: User): boolean {
    const firstNameOk = !!user.firstName && String(user.firstName).trim().length > 0
    const lastNameOk = !!user.lastName && String(user.lastName).trim().length > 0
    const phoneOk = !!user.phoneNumber && String(user.phoneNumber).trim().length > 0
    const addressOk = !!(user as any).address
    return !(firstNameOk && lastNameOk && phoneOk && addressOk)
  }

  private async getGoogleIdentity(idToken: string) {
    const googleClient = new OAuth2Client()

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.get('GOOGLE_CLIENT_ID'),
    })

    const p = ticket.getPayload()
    const email = p?.email?.toLowerCase()
    const name = p?.name
    const googleId = p?.sub

    if (!email || !name || !googleId) return null

    const parts = String(name).trim().split(/\s+/)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''

    return { email, firstName, lastName, googleId }
  }

  public async loginGoogle({ response, request }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        token: vine.string(),
      })
    )

    try {
      const { token } = await request.validateUsing(validator)

      const identity = await this.getGoogleIdentity(token)
      if (!identity) return badRequest(response, 'Bad Request')

      const { email, googleId } = identity

      const user = await this.userRepo.findActiveByEmail(email)

      if (!user) {
        return badRequest(response, 'Akun belum terdaftar. Silakan daftar terlebih dahulu.')
      }

      if (user.googleId && user.googleId !== googleId) {
        return badRequest(response, 'Google account mismatch')
      }

      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }

      if (user.isActive !== 1) {
        return badRequest(response, 'Account suspended')
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

          is_new_user: false,
          needs_profile_completion: false,
        },
      })
    } catch (e: any) {
      return internalError(response, e)
    }
  }

  public async registerGoogle({ response, request }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        token: vine.string(),
      })
    )

    try {
      const { token } = await request.validateUsing(validator)

      const identity = await this.getGoogleIdentity(token)
      if (!identity) return badRequest(response, 'Bad Request')

      const { email, firstName, lastName, googleId } = identity


      let user = await User.query().where('email', email).first()
      let isNewUser = false

      if (!user) {
        isNewUser = true
        const randomPass = randomBytes(24).toString('hex')

        user = await User.create({
          email,
          firstName,
          lastName,
          googleId,
          isActive: 1,
          role: Role.GUEST,
          password: randomPass,
        })
      } else {

        if (user.isActive !== 1) {
          return badRequest(response, 'Account suspended')
        }

        if (user.googleId && user.googleId !== googleId) {
          return badRequest(response, 'Google account mismatch')
        }

        // kalau belum ada googleId, isi
        if (!user.googleId) user.googleId = googleId

        if (!user.firstName) user.firstName = firstName
        if (!user.lastName) user.lastName = lastName

        await user.save()
      }

      const tokenLogin = await this.generateToken(user)
      const needsProfile = isNewUser ? true : this.needsProfileCompletion(user)

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
          is_new_user: isNewUser,
          needs_profile_completion: needsProfile,
        },
      })
    } catch (e: any) {
      return internalError(response, e)
    }
  }

  private async generateToken(user: User): Promise<string> {
    const token = await User.accessTokens.create(user)
    return token.value!.release()
  }
}
