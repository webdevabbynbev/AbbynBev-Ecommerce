import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',
  from: {
    address: env.get('DEFAULT_FROM_EMAIL')!,
    name: 'Abby n Bev', 
  },
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: false,
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME') as string,
        pass: env.get('SMTP_PASSWORD') as string,
      },
    }),
  },
})


export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}