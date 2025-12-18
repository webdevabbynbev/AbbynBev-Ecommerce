import type { HttpContext } from "@adonisjs/core/http"
import KomerceRajaOngkirService from "#services/komerce_rajaongkir_service"

export default class LocationsController {
  private ro = new KomerceRajaOngkirService()

  async provinces({ response }: HttpContext) {
    const data = await this.ro.provinces()
    return response.ok(data)
  }

  async cities({ params, response }: HttpContext) {
    const data = await this.ro.cities(params.provinceId)
    return response.ok(data)
  }

  async districts({ params, response }: HttpContext) {
    const data = await this.ro.districts(params.cityId)
    return response.ok(data)
  }

  async subDistricts({ params, response }: HttpContext) {
    const data = await this.ro.subDistricts(params.districtId)
    return response.ok(data)
  }
}
