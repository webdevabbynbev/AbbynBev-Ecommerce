import vine from '@vinejs/vine'

export const createConcernValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(150),
    description: vine.string().optional(),
    position: vine.number().optional(),
  })
)

export const updateConcernValidator = vine.compile(
  vine.object({
    id: vine.number(),
    name: vine.string().maxLength(150).optional(),
    description: vine.string().optional(),
    position: vine.number().optional(),
  })
)
