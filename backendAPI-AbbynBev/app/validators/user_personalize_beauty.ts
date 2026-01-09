import vine from '@vinejs/vine'

export const CreateUserBeautyConcernValidator = vine.compile(
  vine.object({
    concern_option_ids: vine
      .array(vine.number().withoutDecimals().positive())
      .minLength(1)
      .distinct(),
  })
)

export const CreateUserBeautyProfileValidator = vine.compile(
  vine.object({
    profile_option_ids: vine
      .array(vine.number().withoutDecimals().positive())
      .minLength(1)
      .distinct(),
  })
)
