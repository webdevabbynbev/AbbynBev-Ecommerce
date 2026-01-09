import vine from '@vinejs/vine'

export const createBanner = vine.compile(
  vine.object({
    title: vine.string().nullable(),
    description: vine.string().nullable(),
    position: vine.string().nullable(),
    button_url: vine.string().nullable(),
    button_text: vine.string().nullable(),
    has_button: vine.number().in([1, 0]),
    image: vine.file({
      extnames: ['png', 'jpg', 'jpeg', 'mp4'],
      size: '5mb',
    }),
    image_mobile: vine.file({
      extnames: ['png', 'jpg', 'jpeg', 'mp4'],
      size: '5mb',
    }),
  })
)

export const updateBanner = vine.compile(
  vine.object({
    title: vine.string().nullable().optional(),
    description: vine.string().nullable().optional(),
    position: vine.string().nullable().optional(),
    button_url: vine.string().nullable().optional(),
    button_text: vine.string().nullable().optional(),
    has_button: vine.number().in([1, 0]).optional(),
    image: vine
      .file({
        extnames: ['png', 'jpg', 'jpeg', 'mp4'],
        size: '5mb',
      })
      .optional()
      .nullable(),
    image_mobile: vine
      .file({
        extnames: ['png', 'jpg', 'jpeg', 'mp4'],
        size: '5mb',
      })
      .optional()
      .nullable(),
  })
)
