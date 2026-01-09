import vine from '@vinejs/vine'

export const createProductOnline = vine.compile(
  vine.object({
    product_id: vine.number().positive(),
  })
)

export const updateProductOnline = vine.compile(
  vine.object({
    is_active: vine.boolean(),
  })
)
