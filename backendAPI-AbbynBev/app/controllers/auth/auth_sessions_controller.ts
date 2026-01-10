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

  // ✅ cookie name harus konsisten sama middleware nanti
  private authCookieName = 'auth_token'

  private authCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.get('NODE_ENV') === 'production',
    path: '/',
  }

  private setAuthCookie(response: HttpContext['response'], token: string, maxAgeSeconds: number) {
    response.cookie(this.authCookieName, token, {
      ...this.authCookieOptions,
      maxAge: maxAgeSeconds,
    })
  }

  private clearAuthCookie(response: HttpContext['response']) {
    response.clearCookie(this.authCookieName, {
      ...this.authCookieOptions,
    })
  }

  /**
   * helper: hapus serve.token dari payload supaya token tidak muncul di response body
   */
  private stripTokenFromPayload(payload: any) {
    const cloned = { ...payload, serve: { ...(payload?.serve ?? {}) } }
    if (cloned?.serve) delete cloned.serve.token
    return cloned
  }

  public async loginCashier({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])
      const result = await AuthLoginService.loginCashier(email, password)

      if (!result.ok) return badRequest(response, result.message)

      const token = result.payload?.serve?.token
      if (token) this.setAuthCookie(response, token, 60 * 60 * 24)

      return response.ok(this.stripTokenFromPayload(result.payload))
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

      const token = result.payload?.serve?.token
      if (token) this.setAuthCookie(response, token, 60 * 60 * 24)

      return response.ok(this.stripTokenFromPayload(result.payload))
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

      const token = result.payload?.serve?.token
      if (token) {
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
        this.setAuthCookie(response, token, maxAge)
      }

      return response.ok(this.stripTokenFromPayload(result.payload))
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
    try {
      const user = auth.user
      if (user) {
        const token = await user.currentAccessToken
        if (token) {
          await User.accessTokens.delete(user, token.identifier)
        }
      }

      this.clearAuthCookie(response)

      return response.status(200).send({
        message: 'Logged out successfully.',
        serve: true,
      })
    } catch (error) {
      // tetap lihat best-effort: clear cookie
      this.clearAuthCookie(response)
      return internalError(response, error)
    }
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

  /**
   * ✅ LOGIN GOOGLE (existing only)
   * Kalau user belum ada => error "Akun belum terdaftar..."
   */
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

      // anti takeover
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

      // ✅ SET COOKIE + HIDE TOKEN BODY
      this.setAuthCookie(response, tokenLogin, 60 * 60 * 24 * 30)

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

          // FE redirect: existing => home
          is_new_user: false,
          needs_profile_completion: false,
        },
      })
    } catch (e: any) {
      return internalError(response, e)
    }
  }

  /**
   * ✅ REGISTER GOOGLE (boleh create)
   * new => profile
   * existing => home (link googleId kalau belum ada)
   */
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

        if (!user.googleId) user.googleId = googleId
        if (!user.firstName) user.firstName = firstName
        if (!user.lastName) user.lastName = lastName
        await user.save()
      }

      const tokenLogin = await this.generateToken(user)
      this.setAuthCookie(response, tokenLogin, 60 * 60 * 24 * 30)

      // sesuai rule kamu: yang “register” => ke profile
      const needsProfile = isNewUser ? true : false
      // (kalau mau lebih strict, bisa: isNewUser || this.needsProfileCompletion(user))

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
