import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),

  DRIVE_DISK: Env.schema.enum(['fs'] as const),

  // =========================
  // BITESHIP
  // =========================
  BITESHIP_BASE_URL: Env.schema.string(), // contoh: https://api.biteship.com
  BITESHIP_API_KEY: Env.schema.string(),

  // data toko (biar ongkir & order bisa dibuat)
  COMPANY_NAME: Env.schema.string(),
  COMPANY_EMAIL: Env.schema.string(),
  COMPANY_PHONE: Env.schema.string(),
  COMPANY_ADDRESS: Env.schema.string(),
  COMPANY_POSTAL_CODE: Env.schema.string(),
})
