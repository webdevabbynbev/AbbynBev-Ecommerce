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
}

export type BiteshipCourierRatesPayload = {
  // pilih salah satu metode: postal_code / area_id / coordinate
  origin_postal_code?: number
  destination_postal_code?: number

  origin_area_id?: string
  destination_area_id?: string

  origin_latitude?: number
  origin_longitude?: number
  destination_latitude?: number
  destination_longitude?: number

  couriers: string // contoh: "jne,pos,sicepat"
  items: BiteshipRateItem[]
  courier_insurance?: number
}

class BiteshipService {
  private client = axios.create({
    baseURL: this.baseUrlV1(),
    headers: {
      Authorization: `Bearer ${env.get('BITESHIP_API_KEY')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  })

  private baseUrlV1() {
    const raw = String(env.get('BITESHIP_BASE_URL') || 'https://api.biteship.com')
      .trim()
      .replace(/\/+$/, '')
    // kalau user isi https://api.biteship.com/v1 ya jangan double
    return raw.endsWith('/v1') ? raw : `${raw}/v1`
  }

  // ✅ INI YANG KURANG (biar error TS hilang)
  public async getCourierRates(payload: BiteshipCourierRatesPayload) {
    const { data } = await this.client.post('/rates/couriers', payload)
    return data
  }
}

export default new BiteshipService()
