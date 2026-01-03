import type { HttpContext } from '@adonisjs/core/http'

// NOTE: controller ini dipertahankan sebagai "facade" untuk backward compatibility.
// Routes baru sudah memakai controller yang lebih kecil di folder app/controllers/auth/.
import AuthSessionsController from '#controllers/auth/auth_sessions_controller'
import AuthRegistrationController from '#controllers/auth/auth_registration_controller'
import AuthPasswordResetController from '#controllers/auth/auth_password_reset_controller'
import AuthAccountController from '#controllers/auth/auth_account_controller'

export default class AuthController {
  private sessions = new AuthSessionsController()
  private registration = new AuthRegistrationController()
  private passwordReset = new AuthPasswordResetController()
  private account = new AuthAccountController()

  // Sessions
  public loginCashier(ctx: HttpContext) { return this.sessions.loginCashier(ctx) }
  public loginAdmin(ctx: HttpContext) { return this.sessions.loginAdmin(ctx) }
  public login(ctx: HttpContext) { return this.sessions.login(ctx) }
  public verifyLoginOtp(ctx: HttpContext) { return this.sessions.verifyLoginOtp(ctx) }
  public loginGoogle(ctx: HttpContext) { return this.sessions.loginGoogle(ctx) }
  public logout(ctx: HttpContext) { return this.sessions.logout(ctx) }

  // Registration
  public register(ctx: HttpContext) { return this.registration.register(ctx) }
  public verifyRegisterOtp(ctx: HttpContext) { return this.registration.verifyRegisterOtp(ctx) }

  // Password reset
  public requestForgotPassword(ctx: HttpContext) { return this.passwordReset.requestForgotPassword(ctx) }
  public verifyForgotPassword(ctx: HttpContext) { return this.passwordReset.verifyForgotPassword(ctx) }
  public resetPassword(ctx: HttpContext) { return this.passwordReset.resetPassword(ctx) }

  // Account
  public profile(ctx: HttpContext) { return this.account.profile(ctx) }
  public updateProfile(ctx: HttpContext) { return this.account.updateProfile(ctx) }
  public updateProfilePicture(ctx: HttpContext) { return this.account.updateProfilePicture(ctx) }
  public updatePassword(ctx: HttpContext) { return this.account.updatePassword(ctx) }
  public deactivateAccount(ctx: HttpContext) { return this.account.deactivateAccount(ctx) }
}
