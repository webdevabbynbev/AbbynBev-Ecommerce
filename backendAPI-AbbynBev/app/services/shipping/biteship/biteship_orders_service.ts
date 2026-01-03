import { BiteshipClient } from './biteship_client.js'
import { normalizeBiteshipError } from './biteship_errors.js'


export class BiteshipOrdersService {
  constructor(private api = new BiteshipClient()) {}

  public async createOrder(payload: any) {
    try {
      const res = await this.api.http.post('/orders', payload)
      return res.data
    } catch (e) {
      throw normalizeBiteshipError(e)
    }
  }

  public async getOrderDetail(orderId: string) {
    try {
      const res = await this.api.http.get(`/orders/${orderId}`)
      return res.data
    } catch (e) {
      throw normalizeBiteshipError(e)
    }
  }

  public async getTrackingByWaybill(waybill: string, courierCode: string) {
    try {
      const res = await this.api.http.get(`/trackings/${courierCode}/${waybill}`)
      return res.data
    } catch (e) {
      throw normalizeBiteshipError(e)
    }
  }

  public async cancelOrder(orderId: string) {
    try {
      const res = await this.api.http.post(`/orders/${orderId}/cancel`)
      return res.data
    } catch (e) {
      throw normalizeBiteshipError(e)
    }
  }
}
