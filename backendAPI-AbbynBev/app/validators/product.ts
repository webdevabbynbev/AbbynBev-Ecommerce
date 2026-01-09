import vine from '@vinejs/vine'

export const createProduct = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(150),
    description: vine.string().optional(),
    weight: vine.number().optional(),
    base_price: vine.number(),
  })
)

export const updateProduct = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(150),
    description: vine.string().optional(),
    weight: vine.number().optional(),
    base_price: vine.number(),
  })
)
