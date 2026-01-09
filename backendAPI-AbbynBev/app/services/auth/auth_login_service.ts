import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { Role } from '../../enums/role.js'

export type AuthLoginErrorType = 'badRequest' | 'badRequest400'

export type AuthLoginResult<T> =
  | { ok: true; payload: T }
  | { ok: false; errorType: AuthLoginErrorType; message: string }

export default class AuthLoginService {

  public static async loginCashier(email: string, password: string): Promise<AuthLoginResult<any>> {
    const user = await User.query()
      .where('email', email)
      .where('role', Role.CASHIER)
      .whereNull('deleted_at')
      .first()

    if (!user) {
      return {
        ok: false,
        errorType: 'badRequest',
        message: 'Cashier account not found or has been deactivated.',
      }
    }

    if (user.isActive !== 1) {
      return { ok: false, errorType: 'badRequest', message: 'Account suspended.' }
    }

    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      return { ok: false, errorType: 'badRequest', message: 'Invalid credentials.' }
    }

    const token = await User.accessTokens.create(user)

    return {
      ok: true,
      payload: {
        message: 'Cashier login successfully.',
        serve: {
          data: user.serialize({
            fields: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'role'],
          }),
          token: token.value!.release(),
        },
      },
    }
  }


  public static async loginAdmin(email: string, password: string): Promise<AuthLoginResult<any>> {
    const user = await User.query().where('email', email).whereNull('deleted_at').first()

    if (!user) {
      return {
        ok: false,
        errorType: 'badRequest',
        message: 'Account not found or has been deactivated.',
      }
    }

    if (user.isActive !== 1) {
      return { ok: false, errorType: 'badRequest400', message: 'Account suspended.' }
    }

    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      return { ok: false, errorType: 'badRequest400', message: 'Invalid credentials.' }
    }

    const token = await User.accessTokens.create(user)

    return {
      ok: true,
      payload: {
        message: 'Login successfully.',
        serve: {
          data: user,
          token: token.value!.release(),
        },
      },
    }
  }


  public static async loginCustomer(
    emailOrPhone: string,
    password: string,
    rememberMe: boolean
  ): Promise<AuthLoginResult<any>> {
    const user = await User.query()
      .where((q) => {
        q.where('email', emailOrPhone).orWhere('phone_number', emailOrPhone)
      })
      .where('role', Role.GUEST)
      .whereNull('deleted_at')
      .first()

    if (!user) {
      return {
        ok: false,
        errorType: 'badRequest',
        message: 'Account not found or has been deactivated.',
      }
    }

    if (user.googleId) {
      return {
        ok: false,
        errorType: 'badRequest',
        message: 'Account registered with Google. Please use Google Login.',
      }
    }

    if (user.isActive !== 1) {
      return { ok: false, errorType: 'badRequest', message: 'Account suspended.' }
    }

    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      return { ok: false, errorType: 'badRequest', message: 'Invalid credentials.' }
    }

    const userData = user.serialize({
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
    })

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: rememberMe ? '30 days' : '1 days',
    })

    return {
      ok: true,
      payload: {
        message: 'Login successful.',
        serve: { data: userData, token: token.value!.release() },
      },
    }
  }
}
