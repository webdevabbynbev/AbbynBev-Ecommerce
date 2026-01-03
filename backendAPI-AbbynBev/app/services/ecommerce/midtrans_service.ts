// app/services/ecommerce/midtrans_service.ts
import axios from 'axios'
import env from '#start/env'
import { createHash } from 'node:crypto'

export class MidtransService {
  getSnapUrl() {
    return env.get('MIDTRANS_ENV') === 'production'
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
  }

  async createSnapTransaction(transactionNumber: string, grossAmount: number, user: any) {
    const parameter = {
      transaction_details: {
        order_id: transactionNumber,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.firstName || user.email,
        last_name: user.lastName || '',
        email: user.email,
        phone: user.phoneNumber || '',
      },
    }

    const serverKey = env.get('MIDTRANS_SERVER_KEY')
    const authString = Buffer.from(serverKey + ':').toString('base64')

    const { data: snap } = await axios.post(this.getSnapUrl(), parameter, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authString}`,
      },
    })

    return { token: snap.token, redirect_url: snap.redirect_url }
  }

  verifySignature(payload: any) {
    const orderId = String(payload?.order_id || '')
    const statusCode = String(payload?.status_code || '')
    const grossAmount = String(payload?.gross_amount || '')
    const signatureKey = String(payload?.signature_key || '')

    const serverKey = env.get('MIDTRANS_SERVER_KEY')
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`
    const expected = createHash('sha512').update(raw).digest('hex')

    if (signatureKey && signatureKey !== expected) return false
    return true
  }

  normalizeStatus(v: any) {
    return String(v || '').trim().toLowerCase()
  }

  pickReceipt(payload: any) {
    return (
      payload?.transaction_id ||
      payload?.va_numbers?.[0]?.va_number ||
      payload?.permata_va_number ||
      payload?.bill_key ||
      payload?.biller_code ||
      null
    )
  }
}
