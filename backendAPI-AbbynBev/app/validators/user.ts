import vine from '@vinejs/vine'
import { Role } from '../enums/role.js'
import User from '#models/user'

const guestRole = Role?.GUEST ?? 2

export const createUser = vine.compile(
  vine.object({
    firstName: vine.string().trim(),
    lastName: vine.string().trim(),
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const exists = await db
          .from(User.table)
          .where('email', value)
          .whereNot('role', guestRole)
          .first()

        return !exists
      }),
    phoneNumber: vine.string().optional(),
    gender: vine.number().optional(),
    password: vine.string().minLength(6),
    role: vine.number(),
  })
)

export const updateUser = vine.compile(
  vine.object({
    first_name: vine.string(),
    last_name: vine.string(),
    email: vine.string().unique(async (db, value, field) => {
      const user = await db
        .from('users')
        .whereNot('id', field.data.params.id)
        .whereNot('role', Role.GUEST)
        .where('email', value)
        .first()
      return !user
    }),
    phone_number: vine.string().optional(),
    gender: vine.string().nullable().optional(),
    password: vine.string().nullable(),
    role: vine.number(),
  })
)
