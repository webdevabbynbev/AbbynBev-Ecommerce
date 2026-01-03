import User from '#models/user'
import PasswordReset from '#models/password_resets'
import AuthEmailService from '#services/auth/auth_email_service'

export type ForgotPasswordResult =
  | { ok: true; status: 200; body: any }
  | { ok: false; status: 422 | 500; body: any }

export type ResetPasswordResult =
  | { ok: true; status: 200; body: any }
  | { ok: false; status: 422 | 500; body: any }

/**
 * Service khusus flow forgot/reset password.
 * Tujuannya: controller tipis, dan logic terpusat.
 * NOTE: bentuk response body dijaga mengikuti controller lama.
 */
export default class AuthPasswordResetService {
  public static async request(email: string): Promise<ForgotPasswordResult> {
    const user = await User.query().where('email', email).first()

    if (!user) {
      return {
        ok: false,
        status: 422,
        body: { message: 'Invalid credentials.', serve: [] },
      }
    }

    try {
      await AuthEmailService.sendForgotPasswordEmail(user)
      return {
        ok: true,
        status: 200,
        body: { message: 'Please check your email to change your password.', serve: user },
      }
    } catch {
      return {
        ok: false,
        status: 500,
        body: { message: 'Internal server error.', serve: [] },
      }
    }
  }

  public static async reset(
    email: string,
    token: string,
    newPassword: string
  ): Promise<ResetPasswordResult> {
    try {
      const passwordReset = await PasswordReset.query().where('email', email).where('token', token).first()

      if (!passwordReset) {
        return {
          ok: false,
          status: 422,
          body: { message: 'Token invalid.', serve: [] },
        }
      }

      await PasswordReset.query().where('email', email).where('token', token).delete()

      const user = await User.query().where('email', email).first()
      if (!user) {
        return {
          ok: false,
          status: 422,
          body: { message: 'Invalid credentials.', serve: [] },
        }
      }

      user.password = newPassword
      await user.save()

      return {
        ok: true,
        status: 200,
        body: { message: 'Sucessfully change password.', serve: true },
      }
    } catch {
      return {
        ok: false,
        status: 500,
        body: { message: 'Internal server error.', serve: [] },
      }
    }
  }
}
