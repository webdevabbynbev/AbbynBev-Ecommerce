import vine from '@vinejs/vine'
const relaxedUrl = vine.string().url({ require_tld: false, require_protocol: true })

export const createBrandValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(150),
    description: vine.string().optional(),
    logoUrl: vine.string().optional(),
    bannerUrl: vine.string().optional(),
    country: vine.string().optional(),
    website: vine.string().url().optional(),
    isActive: vine.number().in([0, 1]).optional(),
  })
)

export const updateBrandValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(150).optional(),
    description: vine.string().optional(),
    logoUrl: relaxedUrl.optional(),
    bannerUrl: relaxedUrl.optional(),
    country: vine.string().optional(),
    website: relaxedUrl.optional(),
    isActive: vine.number().in([0, 1]).optional(),
  })
)
