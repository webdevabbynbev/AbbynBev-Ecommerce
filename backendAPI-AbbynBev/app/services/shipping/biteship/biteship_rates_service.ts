import { BiteshipClient } from './biteship_client.js'
import { normalizeBiteshipError } from './biteship_errors.js'

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

export class BiteshipRatesService {
  constructor(private api = new BiteshipClient()) {}

  public async getCourierRates(payload: BiteshipCourierRatesPayload) {
    try {
      const res = await this.api.http.post('/rates/couriers', payload)
      return res.data
    } catch (e) {
      throw normalizeBiteshipError(e)
    }
  }
}
