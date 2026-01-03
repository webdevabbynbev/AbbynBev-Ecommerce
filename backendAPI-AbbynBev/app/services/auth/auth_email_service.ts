import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import router from '@adonisjs/core/services/router'

import PasswordReset from '#models/password_resets'
import type User from '#models/user'

/**
 * Semua email terkait auth/user dipusatkan di sini.
 * Model User jadi ringan (hanya schema + relasi + hooks).
 */
export default class AuthEmailService {
  private static getAppMeta() {
    const appDomain = env.get('APP_URL')
    const clientDomain = env.get('APP_CLIENT') || appDomain
    const appName = env.get('APP_TITLE')
    const currentYear = new Date().getFullYear()

    return { appDomain, clientDomain, appName, currentYear }
  }

  private static getFromEmail(): string {
    const from = env.get('DEFAULT_FROM_EMAIL')
    if (!from) throw new Error('DEFAULT_FROM_EMAIL is not set in .env')
    return from as string
  }

  /**
   * NOTE: route name `verifyEmail` saat ini belum ketemu di start/routes.ts.
   * Fungsi ini aman disimpan dulu, tapi baru akan kepake kalau route-nya sudah ada.
   */
  public static async sendVerificationEmail(user: User) {
    const { appDomain, appName, currentYear } = this.getAppMeta()

    const url = router
      .builder()
      .params({ email: user.email })
      .prefixUrl(appDomain as string)
      .makeSigned('verifyEmail', { expiresIn: '24hours' })

    await mail.send((message) => {
      message
        .from(this.getFromEmail())
        .to(user.email)
        .subject('[Abby n Bev] Verifikasi Email')
        .htmlView('email_verification', {
          user,
          url,
          appName,
          appDomain,
          currentYear,
        })
    })
  }

  public static async sendWelcomeLetter(user: User) {
    const { appDomain, appName, currentYear } = this.getAppMeta()

    await mail.send((message) => {
      message
        .from(this.getFromEmail())
        .to(user.email)
        .subject('Welcome to Abby n Bev ✨')
        .htmlView('emails/welcome_letter', {
          user,
          appName,
          appDomain,
          currentYear,
        })
    })
  }

  /**
   * Flow reset password saat ini:
   * - backend bikin signed route ke verifyForgotPassword (24h)
   * - signature disimpan di table password_resets
   * - email berisi link ke client (reset-password) dengan token=signature
   */
  public static async sendForgotPasswordEmail(user: User) {
    const { appDomain, clientDomain, appName, currentYear } = this.getAppMeta()

    const signedUrl = router
      .builder()
      .params({ email: user.email })
      .prefixUrl(appDomain as string)
      .makeSigned('verifyForgotPassword', { expiresIn: '24hours' })

    const urlObj = new URL(signedUrl)
    const signature = urlObj.searchParams.get('signature')
    if (!signature) throw new Error('Signature not found in signed URL')

    const resetUrl = `${clientDomain}/reset-password?token=${signature}&email=${user.email}`

    await mail.send((message) => {
      message
        .from(this.getFromEmail())
        .to(user.email)
        .subject('[Abby n Bev] Reset Password')
        .htmlView('emails/forgot', {
          user,
          url: resetUrl,
          appName,
          appDomain,
          currentYear,
        })
    })

    // keep behavior lama: 1 request = 1 row baru
    const passwordReset = new PasswordReset()
    passwordReset.email = user.email
    passwordReset.token = signature
    await passwordReset.save()
  }
}
