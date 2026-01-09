import vine from '@vinejs/vine'

export const storePersonaValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100),
    description: vine.string().optional(),
  })
)

export const updatePersonaValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(100).optional(),
    description: vine.string().optional(),
  })
)
