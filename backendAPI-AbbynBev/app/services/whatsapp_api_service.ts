import axios from 'axios'
import env from '#start/env'

export default class WhatsAppService {
  private token = env.get('WHATSAPP_ACCESS_TOKEN') as string
  private phoneNumberId = env.get('WHATSAPP_PHONE_NUMBER_ID') as string
  private apiUrl = env.get('WHATSAPP_API_URL') as string
   public normalizeNumber(input: string) {
    let n = (input || '').replace(/\s+/g, '').replace(/-/g, '')
    if (n.startsWith('+')) n = n.slice(1)
    if (n.startsWith('0')) n = '62' + n.slice(1)
    if (n.startsWith('8')) n = '62' + n
    return n
  }


  public async sendOTP(to: string, otp: string) {
     return this.sendTemplate(to, 'otp_code', [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otp }],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: otp }],
      },
    ])
  }

  public async sendRegisterSuccess(to: string, name?: string | null) {
    const displayName = (name || '').trim() || 'Customer'
    return this.sendTemplate(to, 'register_success', [
      {
        type: 'body',
        parameters: [{ type: 'text', text: displayName }],
      },
    ])
  }

  public async sendTransactionSuccess(to: string, transactionNumber: string) {
    return this.sendTemplate(to, 'transaction_success', [
      {
        type: 'body',
        parameters: [{ type: 'text', text: transactionNumber }],
      },
    ])
  }

  private async sendTemplate(to: string, name: string, components: any[]) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`

    try {
      const res = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name,
            language: { code: 'en' },
            components,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return res.data
    } catch (error: any) {
      console.error(`Error sending ${name} via WhatsApp:`, error.response?.data || error.message)
      throw new Error(`Gagal mengirim ${name} via WhatsApp`)
    }
  }
}