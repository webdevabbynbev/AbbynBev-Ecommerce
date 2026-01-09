import vine from '@vinejs/vine'

export const storeTagValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100),
    description: vine.string().optional(),
  })
)

export const updateTagValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100).optional(),
    description: vine.string().optional(),
  })
)
