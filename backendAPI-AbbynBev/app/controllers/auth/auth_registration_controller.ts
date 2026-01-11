import type { HttpContext } from '@adonisjs/core/http'

import AuthRegisterService from '#services/auth/auth_register_service'
import {
  register as registerValidator,
  verifyRegisterOtp as verifyRegisterOtpValidator,
} from '#validators/auth'

import { vineMessagesToString } from '../../utils/validation.js'

export default class AuthRegistrationController {
  public async register({ request, response }: HttpContext) {
    try {
      const validated = await request.validateUsing(registerValidator)

      const {
        email,
        phone_number,
        first_name,
        last_name,
        gender,
        accept_privacy_policy,
        send_via,
      } = validated

      // ✅ wajib setuju privacy policy sebelum daftar (manual)
      if (!accept_privacy_policy) {
        return response.status(422).send({
          message: 'Anda harus menyetujui Privacy Policy sebelum mendaftar.',
          serve: null,
        })
      }

      // ✅ pilih pengiriman OTP (pakai nilai yang sudah divalidasi)
      const raw = String(send_via || 'whatsapp').toLowerCase()
      const sendVia: 'email' | 'whatsapp' = raw === 'email' ? 'email' : 'whatsapp'

      const body = await AuthRegisterService.requestRegisterOtp({
        email,
        phone_number,
        first_name,
        last_name,
        gender,
        send_via: sendVia,
      })

      return response.status(200).send(body)
    } catch (error: any) {
      if (error?.status === 422) {
        return response.status(422).send({
          message: vineMessagesToString(error),
          serve: null,
        })
      }

      console.error(error)
      return response.status(error.status || 500).send({
        message: error.messages || error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async verifyRegisterOtp({ request, response }: HttpContext) {
    try {
      const validated = await request.validateUsing(verifyRegisterOtpValidator)

      if (!validated.accept_privacy_policy) {
        return response.status(422).send({
          message: 'Anda harus menyetujui Privacy Policy sebelum mendaftar.',
          serve: null,
        })
      }

      // buang field consent sebelum dilempar ke service (biar payload tetap sesuai kebutuhan service)
      const { accept_privacy_policy, ...payload } = validated

      const result = await AuthRegisterService.verifyRegisterOtp(payload as any)

      if (!result.ok) {
        return response.badRequest({ message: result.message, serve: null })
      }

      return response.ok(result.payload)
    } catch (error: any) {
      if (error?.status === 422) {
        return response.status(422).send({
          message: vineMessagesToString(error),
          serve: null,
        })
      }

      return response.status(500).send({
        message: error?.message || 'Internal Server Error',
        serve: null,
      })
    }
  }
}
