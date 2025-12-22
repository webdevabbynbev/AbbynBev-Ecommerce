// app/services/biteship_service.ts
import axios from 'axios'
import env from '#start/env'

export type BiteshipRateItem = {
  name: string
  description?: string
  value: number
  quantity: number
  weight: number // gram
  length?: number
  width?: number
  height?: number
  category?: string // optional (sesuai docs)
}

export type BiteshipCourierRatesPayload = {
  origin_postal_code?: number
  destination_postal_code?: number

  origin_area_id?: string
  destination_area_id?: string

  origin_latitude?: number
  origin_longitude?: number
  destination_latitude?: number
  destination_longitude?: number

  couriers: string
  items: BiteshipRateItem[]
  courier_insurance?: number
}

class BiteshipService {
  private client = axios.create({
    baseURL: this.baseUrlV1(),
    headers: {
      // ✅ sesuai docs: authorization = API KEY langsung (tanpa Bearer)
      Authorization: String(env.get('BITESHIP_API_KEY')),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  })

  private baseUrlV1() {
    const raw = String(env.get('BITESHIP_BASE_URL') || 'https://api.biteship.com')
      .trim()
      .replace(/\/+$/, '')
    return raw.endsWith('/v1') ? raw : `${raw}/v1`
  }

  public async getCourierRates(payload: BiteshipCourierRatesPayload) {
    const { data } = await this.client.post('/rates/couriers', payload)
    return data
  }
}

export default new BiteshipService()
