import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Timezone (optional)
  TZ: Env.schema.string.optional(),

  // App & Server
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  APP_KEY: Env.schema.string(),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const),

  // App metadata (sesuai .env kamu)
  APP_NAME: Env.schema.string.optional(), // saran: isi di .env
  APP_TITLE: Env.schema.string(),
  APP_URL: Env.schema.string(),
  APP_CLIENT: Env.schema.string(),
  APP_LANDING: Env.schema.string.optional(),

  // Database
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  
  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */


  // Mailer / SMTP
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.number(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  DEFAULT_FROM_EMAIL: Env.schema.string.optional(),
  

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */

  // Storage
  DRIVE_DISK: Env.schema.enum(['fs'] as const),

  // AWS S3 (optional)
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),

  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: Env.schema.string.optional(),
  CLOUDINARY_API_KEY: Env.schema.string.optional(),
  CLOUDINARY_API_SECRET: Env.schema.string.optional(),

  // Midtrans
  MIDTRANS_SERVER_KEY: Env.schema.string.optional(),
  MIDTRANS_CLIENT_KEY: Env.schema.string.optional(),
  MIDTRANS_ENV: Env.schema.enum(['sandbox', 'production'] as const),

  // WhatsApp API (optional)
// Di file start/env.ts
WHATSAPP_PHONE_NUMBER_ID: Env.schema.string(),
WHATSAPP_ACCESS_TOKEN: Env.schema.string(),
WHATSAPP_API_URL: Env.schema.string.optional(),

// Yang ini baru boleh optional karena di Service kamu sudah ada default-nya
WHATSAPP_TEMPLATE_NAME: Env.schema.string.optional(),
WHATSAPP_TEMPLATE_LANG: Env.schema.string.optional(),


  // =========================
  // BITESHIP (Wajib kalau Komerce dihapus)
  // =========================
  BITESHIP_BASE_URL: Env.schema.string(), // contoh: https://api.biteship.com
  BITESHIP_API_KEY: Env.schema.string(),

  // Data toko (dipakai saat create order/rates by address)
  COMPANY_NAME: Env.schema.string(),
  COMPANY_CONTACT_NAME: Env.schema.string(),
  COMPANY_PHONE: Env.schema.string(),
  COMPANY_EMAIL: Env.schema.string(),
  COMPANY_ADDRESS: Env.schema.string(),
  COMPANY_POSTAL_CODE: Env.schema.string(),
  COMPANY_PINPOINT: Env.schema.string.optional(),
})
