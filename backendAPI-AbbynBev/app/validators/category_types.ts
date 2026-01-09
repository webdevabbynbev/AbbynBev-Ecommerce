import vine from '@vinejs/vine'

export const createCategoryType = vine.compile(
  vine.object({
    name: vine.string(),
    parentId: vine.number().optional(),
    level: vine.number().optional(),
  })
)
