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
      const { email, phone_number, first_name, last_name, gender } =
        await request.validateUsing(registerValidator)

      const raw = String(request.input('send_via') || 'email').toLowerCase()
      const sendVia: 'email' | 'whatsapp' = raw === 'whatsapp' ? 'whatsapp' : 'email'

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
      console.error(error)
      return response.status(error.status || 500).send({
        message: error.messages || error.message || 'Internal Server Error',
        serve: null,
      })
    }
  }

  public async verifyRegisterOtp({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(verifyRegisterOtpValidator)
      const result = await AuthRegisterService.verifyRegisterOtp(payload)

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
