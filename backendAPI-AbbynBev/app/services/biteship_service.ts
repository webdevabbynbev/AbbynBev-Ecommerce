// app/services/biteship_service.ts
import axios from 'axios'
import env from '#start/env'

/**
 * =========================
 * RATES
 * =========================
 */
export type BiteshipRateItem = {
  name: string
  description?: string
  value: number
  quantity: number
  weight: number // gram
  length?: number
  width?: number
  height?: number
  category?: string
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

/**
 * =========================
 * ORDER (Generate Resi)
 * =========================
 */
export type BiteshipCreateOrderItem = {
  name: string
  description?: string
  category?: string
  value: number
  quantity: number
  weight: number // gram
  length?: number
  width?: number
  height?: number
  sku?: string
}

export type BiteshipCreateOrderPayload = {
  shipper_contact_name?: string
  shipper_contact_phone?: string
  shipper_contact_email?: string
  shipper_organization?: string

  origin_contact_name: string
  origin_contact_phone: string
  origin_contact_email?: string
  origin_address: string
  origin_note?: string
  origin_postal_code?: number
  origin_area_id?: string
  origin_coordinate?: { latitude: number; longitude: number }

  destination_contact_name: string
  destination_contact_phone: string
  destination_contact_email?: string
  destination_address: string
  destination_note?: string
  destination_postal_code?: number
  destination_area_id?: string
  destination_coordinate?: { latitude: number; longitude: number }

  courier_company: string
  courier_type: string
  courier_insurance?: number

  delivery_type: 'now' | 'scheduled'
  delivery_date?: string // YYYY-MM-DD (kalau scheduled)
  delivery_time?: string // HH:mm (kalau scheduled)

  order_note?: string
  metadata?: any
  reference_id?: string

  items: BiteshipCreateOrderItem[]
}

export type BiteshipCreateOrderResponse = {
  success: boolean
  message?: string
  error?: string
  code?: number
  object?: string
  id?: string
  reference_id?: string | null
  status?: string
  courier?: {
    tracking_id?: string
    waybill_id?: string
    company?: string
    type?: string
    link?: string | null
  }
  details?: any
}

/**
 * =========================
 * TRACKING
 * =========================
 */
export type BiteshipTrackingResponse = {
  success: boolean
  message?: string
  object?: string
  id?: string
  waybill_id?: string
  status?: string
  courier?: any
  origin?: any
  destination?: any
  history?: any[]
  link?: string
  order_id?: string
}

/**
 * =========================
 * CANCEL ORDER
 * =========================
 */
export type BiteshipCancelOrderResponse = {
  success: boolean
  message?: string
  object?: string
  id?: string
  status?: string
  cancellation_reason_code?: string
  cancellation_reason?: string
}

export type BiteshipCancellationReasonsResponse = {
  success: boolean
  message?: string
  cancellation_reasons?: Array<{ code: string; reason: string }>
}

class BiteshipService {
  private client = axios.create({
    baseURL: this.baseUrlV1(),
    headers: {
      // ✅ paling aman: pakai header "authorization" (lowercase)
      authorization: String(env.get('BITESHIP_API_KEY')),
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

  /**
   * GET COURIER RATES
   * POST /v1/rates/couriers
   */
  public async getCourierRates(payload: BiteshipCourierRatesPayload) {
    const { data } = await this.client.post('/rates/couriers', payload)
    return data
  }

  /**
   * CREATE ORDER (Generate Resi/Waybill)
   * POST /v1/orders
   */
  public async createOrder(payload: BiteshipCreateOrderPayload) {
    const { data } = await this.client.post<BiteshipCreateOrderResponse>('/orders', payload)
    return data
  }

  /**
   * RETRIEVE TRACKING (by tracking_id)
   * GET /v1/trackings/:id
   */
  public async retrieveTracking(trackingId: string) {
    const { data } = await this.client.get<BiteshipTrackingResponse>(
      `/trackings/${encodeURIComponent(trackingId)}`
    )
    return data
  }

  /**
   * RETRIEVE PUBLIC TRACKING (by waybill + courier_code)
   * GET /v1/trackings/:waybill_id/couriers/:courier_code
   */
  public async retrievePublicTracking(waybillId: string, courierCode: string) {
    const { data } = await this.client.get<BiteshipTrackingResponse>(
      `/trackings/${encodeURIComponent(waybillId)}/couriers/${encodeURIComponent(courierCode)}`
    )
    return data
  }

  /**
   * CANCEL ORDER
   * POST /v1/orders/:id/cancel
   */
  public async cancelOrder(
    orderId: string,
    cancellation_reason_code: string,
    cancellation_reason?: string
  ) {
    const { data } = await this.client.post<BiteshipCancelOrderResponse>(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        cancellation_reason_code,
        ...(cancellation_reason ? { cancellation_reason } : {}),
      }
    )
    return data
  }

  /**
   * GET CANCELLATION REASONS
   * GET /v1/orders/cancellation_reasons?lang=id|en
   */
  public async getCancellationReasons(lang: 'id' | 'en' = 'id') {
    const { data } = await this.client.get<BiteshipCancellationReasonsResponse>(
      `/orders/cancellation_reasons?lang=${encodeURIComponent(lang)}`
    )
    return data
  }
}

export default new BiteshipService()
