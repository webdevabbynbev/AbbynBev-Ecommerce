import vine from '@vinejs/vine'

export const storeProfileCategoryOptionValidator = vine.compile(
  vine.object({
    profileCategoriesId: vine.number(),
    label: vine.string().trim().maxLength(100),
    value: vine.string().trim().maxLength(100),
    isActive: vine.boolean().optional(),
  })
)

export const updateProfileCategoryOptionValidator = vine.compile(
  vine.object({
    profileCategoriesId: vine.number().optional(),
    label: vine.string().trim().maxLength(100).optional(),
    value: vine.string().trim().maxLength(100).optional(),
    isActive: vine.boolean().optional(),
  })
)
