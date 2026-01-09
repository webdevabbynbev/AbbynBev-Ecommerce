import vine from '@vinejs/vine'
export const create = vine.compile(
  vine.object({
    name: vine.string(),
  })
)
