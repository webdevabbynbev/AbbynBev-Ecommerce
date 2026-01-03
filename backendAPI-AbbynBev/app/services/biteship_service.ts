import { BiteshipRatesService } from '#services/shipping/biteship/biteship_rates_service'
import { BiteshipOrdersService } from '#services/shipping/biteship/biteship_orders_service'

export * from '#services/shipping/biteship/biteship_rates_service' // keep types exported

class BiteshipService {
  private rates = new BiteshipRatesService()
  private orders = new BiteshipOrdersService()

  // samain nama method dengan yang lama (biar gak break)
  public getCourierRates(payload: any) {
    return this.rates.getCourierRates(payload)
  }

  public createOrder(payload: any) {
    return this.orders.createOrder(payload)
  }

  public getOrderDetail(orderId: string) {
    return this.orders.getOrderDetail(orderId)
  }

  public getTrackingByWaybill(waybill: string, courierCode: string) {
    return this.orders.getTrackingByWaybill(waybill, courierCode)
  }

  public cancelOrder(orderId: string) {
    return this.orders.cancelOrder(orderId)
  }
}

export default new BiteshipService()
