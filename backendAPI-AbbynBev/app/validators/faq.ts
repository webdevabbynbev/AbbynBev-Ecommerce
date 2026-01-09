import vine from '@vinejs/vine'

export const createFaq = vine.compile(
  vine.object({
    question: vine.string(),
    answer: vine.string(),
  })
)
