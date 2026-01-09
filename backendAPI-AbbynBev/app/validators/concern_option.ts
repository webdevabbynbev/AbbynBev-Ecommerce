import vine from '@vinejs/vine'

export const createConcernOptionValidator = vine.compile(
  vine.object({
    concernId: vine.number(),
    name: vine.string().maxLength(150),
    description: vine.string().optional(),
    position: vine.number().optional(),
  })
)

export const updateConcernOptionValidator = vine.compile(
  vine.object({
    concernId: vine.number().optional(),
    name: vine.string().maxLength(150).optional(),
    description: vine.string().optional(),
    position: vine.number().optional(),
  })
)
