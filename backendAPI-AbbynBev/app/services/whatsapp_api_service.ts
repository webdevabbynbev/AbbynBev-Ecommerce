import axios from 'axios'
import env from '#start/env'

export default class WhatsAppService {
  private token = env.get('WHATSAPP_ACCESS_TOKEN') as string
  private phoneNumberId = env.get('WHATSAPP_PHONE_NUMBER_ID') as string
  private apiUrl = env.get('WHATSAPP_API_URL') as string

  private templateName = (env.get('WHATSAPP_TEMPLATE_NAME') as string) || 'otp_code'
  private templateLang = (env.get('WHATSAPP_TEMPLATE_LANG') as string) || 'id'

  public async sendOTP(to: string, otp: string) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`

    try {
      const res = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: this.templateName,
            language: { code: this.templateLang },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return res.data
    } catch (error: any) {
      // IMPORTANT: biar ketahuan error WA yang sebenarnya
      console.error('WA ERROR DETAIL:', error.response?.data || error.message)
      throw error
    }
  }
}
