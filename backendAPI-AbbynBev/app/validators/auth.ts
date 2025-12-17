import vine from '@vinejs/vine'
import User from '#models/user'

export const register = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const exists = await db
          .from(User.table)
          .where('email', value)
          .whereNull('deleted_at')
          .first()
        return !exists
      }),
    phone_number: vine
      .string()
      .regex(/^(?:\+62|62|0)[0-9]{9,14}$/)
      .unique(async (db, value) => {
        const exists = await db
          .from(User.table)
          .where('phone_number', value)
          .whereNull('deleted_at')
          .first()
        return !exists
      }),
    first_name: vine.string().trim(),
    last_name: vine.string().trim(),
    gender: vine.number().in([1, 2]),
    password: vine
      .string()
      .minLength(8)
      .maxLength(16)
      .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/),

         // ✅ baru
    send_via: vine.enum(['email', 'whatsapp']).optional(),
  })
)

export const login = vine.compile(
  vine.object({
    email_or_phone: vine.string().regex(/^(?:\+62|62|0)[0-9]{9,14}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    password: vine.string().minLength(8),
  })
)

export const verifyLoginOtp = vine.compile(
  vine.object({
    email_or_phone: vine.string().regex(/^(?:\+62|62|0)[0-9]{9,14}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    otp: vine.string().minLength(4).maxLength(6),
  })
)

export const verifyRegisterOtp = vine.compile(
  vine.object({
    email: vine.string().email(),
    phone_number: vine.string().regex(/^(?:\+62|62|0)[0-9]{9,14}$/),
    first_name: vine.string().trim(),
    last_name: vine.string().trim(),
    otp: vine.string(),
    gender: vine.number().in([1, 2]),
    password: vine
      .string()
      .minLength(8)
      .maxLength(16)
      .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/),
  })
)

export const requestForgotPassword = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

export const resetPassword = vine.compile(
  vine.object({
    email: vine.string().email(),
    otp: vine.string().optional(),
    password: vine
      .string()
      .minLength(8)
      .maxLength(16)
      .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/),
  })
)

export const changePassword = vine.compile(
  vine.object({
    password: vine
      .string()
      .minLength(8)
      .maxLength(16)
      .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/),
  })
)

export const updateProfile = vine.compile(
  vine.object({
    image: vine
      .file({
        extnames: ['png', 'jpg', 'jpeg'],
        size: '2mb',
      })
      .optional()
      .nullable(),
    first_name: vine.string().trim().optional().nullable(),
    last_name: vine.string().trim().optional().nullable(),
    dob: vine.date().optional().nullable(),
    phone_number: vine.string().optional().nullable(),
    gender: vine.number().in([1, 2]).optional().nullable(),
    email: vine.string().email(),
  })
)

export const updateProfilePicture = vine.compile(
  vine.object({
    image: vine.file({
      extnames: ['png', 'jpg', 'jpeg'],
      size: '2mb',
    }),
  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    old_password: vine.string().minLength(8),
    new_password: vine
      .string()
      .minLength(8)
      .maxLength(16)
      .regex(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/),
    confirm_password: vine.string().sameAs('new_password'),
  })
)

export const deactivateAccountValidator = vine.compile(
  vine.object({
    confirm: vine.boolean(),
  })
)


