import vine from '@vinejs/vine'

export const createFlashSaleValidator = vine.compile(
  vine.object({
    title: vine.string().trim().maxLength(255),
    description: vine.string().optional().nullable(),
    has_button: vine.boolean().optional(),
    button_text: vine.string().optional().nullable(),
    button_url: vine.string().optional().nullable(),
    start_datetime: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss'] }),
    end_datetime: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss'] }).afterField('start_datetime', {
      // @ts-ignore
      compare: 'datetime',
      format: ['YYYY-MM-DD HH:mm:ss'],
    }),
    is_publish: vine.boolean().optional(),
    products: vine
      .array(
        vine.object({
          product_id: vine.number().exists((db, value) => {
            return db.table('products').knexQuery.where('id', value).whereNull('deleted_at').first()
          }),
          flash_price: vine.number().min(1),
          stock: vine.number().min(0),
        })
      )
      .minLength(1),
  })
)

export const updateFlashSaleValidator = vine.compile(
  vine.object({
    title: vine.string().trim().maxLength(255).optional(),
    description: vine.string().optional().nullable(),
    has_button: vine.boolean().optional(),
    button_text: vine.string().optional().nullable(),
    button_url: vine.string().optional().nullable(),

    start_datetime: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss'] }).optional(),
    end_datetime: vine
      .date({ formats: ['YYYY-MM-DD HH:mm:ss'] })
      .afterField('start_datetime', {
        // @ts-ignore
        compare: 'datetime',
        format: ['YYYY-MM-DD HH:mm:ss'],
      })
      .optional(),

    is_publish: vine.boolean().optional(),

    products: vine
      .array(
        vine.object({
          product_id: vine.number().exists((db, value) => {
            return db.table('products').knexQuery.where('id', value).whereNull('deleted_at').first()
          }),
          flash_price: vine.number().min(1),
          stock: vine.number().min(0),
        })
      )
      .minLength(1)
      .optional(),
  })
)
