import axios from 'axios'
import env from '#start/env'

export default class PickupService {
  private client

  constructor() {
    this.client = axios.create({
      baseURL: env.get('KOMERCE_DELIVERY_BASE_URL'),
      headers: {
        'x-api-key': env.get('KOMERCE_DELIVERY_API_KEY'),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })
  }

  public async requestPickup(
    orderNo: string,
    pickupDate: string,
    pickupTime: string,
    pickupVehicle: string
  ) {
    try {
      const payload = {
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        pickup_vehicle: pickupVehicle,
        orders: [{ order_no: orderNo }],
      }

      const { data } = await this.client.post('/order/api/v1/pickup/request', payload)

      if (env.get('NODE_ENV') === 'development') {
        const first = data?.data?.[0]
        if (first && first.status === 'failed') {
          first.status = 'success'
          first.awb = `DUMMYAWB${Date.now()}`
        }
      }

      return data
    } catch (error) {
      console.error(' PickupService Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.meta?.message || error.message)
    }
  }
}
