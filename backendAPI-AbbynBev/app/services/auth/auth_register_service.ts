import Otp from '#models/otp'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { OtpAction } from '../../enums/setting_types.js'
import Helpers from '../../utils/helpers.js'
import { Role } from '../../enums/role.js'
import WhatsAppService from '#services/whatsapp_api_service'
import AuthEmailService from '#services/auth/auth_email_service'

type SendVia = 'email' | 'whatsapp'

export type RegisterOtpRequest = {
  email: string
  phone_number: string
  first_name: string
  last_name: string
  gender: any
  send_via: SendVia
}

export type VerifyRegisterOtpRequest = {
  email: string
  phone_number: string
  first_name: string
  last_name: string
  otp: string
  gender: any
  password: string
}

export type VerifyRegisterOtpResult =
  | { ok: true; payload: any }
  | { ok: false; message: string }

export default class AuthRegisterService {

  public static async requestRegisterOtp(payload: RegisterOtpRequest) {
    const { email, phone_number, first_name, last_name, gender, send_via } = payload

    const otp = await this.generateUniqueOtp(email, OtpAction.REGISTER)
    const hashedOtp = await hash.make(otp)

    await Otp.updateOrCreate(
      { email, action: OtpAction.REGISTER },
      {
        code: hashedOtp,
        expiredAt: DateTime.now().plus({ minutes: 5 }),
        action: OtpAction.REGISTER,
      }
    )

    if (send_via === 'email') {
      await this.sendOtpEmail(email, otp, first_name)

      return {
        message: 'OTP sent via Email.',
        serve: {
          otp_sent_via: 'email',
          email,
          phone_number,
          first_name,
          last_name,
          gender,
        },
      }
    }


    try {
      const wa = new WhatsAppService()
      await wa.sendOTP(this.normalizeWaNumber(phone_number), otp)

      return {
        message: 'OTP sent via WhatsApp.',
        serve: {
          otp_sent_via: 'whatsapp',
          email,
          phone_number,
          first_name,
          last_name,
          gender,
        },
      }
    } catch (e) {
      // fallback: WA gagal → kirim email supaya register tetap bisa jalan
      await this.sendOtpEmail(email, otp, first_name)

      return {
        message: 'WhatsApp failed, OTP sent via Email.',
        serve: {
          otp_sent_via: 'email',
          email,
          phone_number,
          first_name,
          last_name,
          gender,
        },
      }
    }
  }

  public static async verifyRegisterOtp(
    payload: VerifyRegisterOtpRequest
  ): Promise<VerifyRegisterOtpResult> {
    const { email, phone_number, first_name, last_name, otp, gender, password } = payload

    const otpExist = await Otp.query()
      .where('email', email)
      .where('action', OtpAction.REGISTER)
      .where('expired_at', '>', new Date())
      .first()

    if (!otpExist) {
      return { ok: false, message: 'OTP Not Found or Expired' }
    }

    const isValidOtp = await hash.verify(otpExist.code, otp)
    if (!isValidOtp) {
      return { ok: false, message: 'Invalid OTP' }
    }

    await otpExist.delete()

    const existing = await User.query()
      .where((q) => {
        q.where('email', email).orWhere('phone_number', phone_number)
      })
      .whereNull('deleted_at')
      .first()

    if (existing) {
      return { ok: false, message: 'Email atau nomor HP sudah terdaftar.' }
    }

    const user = await User.create({
      email,
      phoneNumber: phone_number,
      firstName: first_name,
      lastName: last_name,
      gender: gender || null,
      password,
      isActive: 1,
      role: Role.GUEST,
    })

    try {
      await AuthEmailService.sendWelcomeLetter(user)
    } catch (e: any) {
      console.error('Gagal kirim welcome letter:', e.message)
    }

    const token = await User.accessTokens.create(user)

    return {
      ok: true,
      payload: {
        message: 'Register successful, OTP verified.',
        serve: {
          data: user.serialize({
            fields: [
              'id',
              'firstName',
              'lastName',
              'email',
              'phoneNumber',
              'gender',
              'dob',
              'photoProfile',
              'role',
            ],
          }),
          token: token.value!.release(),
        },
      },
    }
  }

  private static async sendOtpEmail(toEmail: string, otp: string, name?: string) {
    const from = env.get('DEFAULT_FROM_EMAIL')
    if (!from) throw new Error('DEFAULT_FROM_EMAIL is not set in .env')

    await mail.send((message) => {
      message
        .from(from)
        .to(toEmail)
        .subject('[Abby n Bev] OTP Verification')
        .htmlView('emails/otp', {
          otp,
          email: toEmail,
          name: name || null,
        })
    })
  }

  private static async generateUniqueOtp(email: string, action: OtpAction): Promise<string> {
    while (true) {
      const otp = Helpers.generateOtp()

      const existingOtp = await Otp.query()
        .where('email', email)
        .where('action', action)
        .where('expired_at', '>=', new Date())
        .first()

      if (!existingOtp) return otp

      const same = await hash.verify(existingOtp.code, otp)
      if (!same) return otp
    }
  }

  private static normalizeWaNumber(input: string) {
    let n = (input || '').replace(/\s+/g, '').replace(/-/g, '')
    if (n.startsWith('+')) n = n.slice(1)
    if (n.startsWith('0')) n = '62' + n.slice(1)
    if (n.startsWith('8')) n = '62' + n
    return n
  }
}
