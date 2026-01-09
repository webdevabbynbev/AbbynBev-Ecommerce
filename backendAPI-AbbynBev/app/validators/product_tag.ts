import vine from '@vinejs/vine'

export const assignTagValidator = vine.compile(
  vine.object({
    productId: vine.number(),
    tagId: vine.number(),
    start_date: vine.date().optional(),
    end_date: vine.date().optional(),
  })
)
