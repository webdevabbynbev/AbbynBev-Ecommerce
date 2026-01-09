import vine from '@vinejs/vine'

export const createSupportTicketGuestValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    email: vine.string().email(),
    phone: vine.string().optional(),
    subject: vine.string().trim(),
    message: vine.string().trim(),
  })
)

export const createSupportTicketAuthValidator = vine.compile(
  vine.object({
    subject: vine.string().trim(),
    message: vine.string().trim(),
  })
)

export const updateSupportTicketValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'in_progress', 'resolved']),
  })
)
