import axios from "axios"
import env from "#start/env"

export default class KomerceRajaOngkirService {
  private baseUrl = env.get("KOMERCE_BASE_URL")
  private key = env.get("KOMERCE_SHIPPING_COST_KEY")

  private client = axios.create({
    baseURL: this.baseUrl,
    headers: {
      key: this.key, // header key (umumnya case-insensitive)
    },
    timeout: 15000,
  })

  async provinces() {
    const res = await this.client.get("/destination/province")
    return res.data
  }

  async cities(provinceId: string | number) {
    const res = await this.client.get(`/destination/city/${provinceId}`)
    return res.data
  }

  async districts(cityId: string | number) {
    const res = await this.client.get(`/destination/district/${cityId}`)
    return res.data
  }

  async subDistricts(districtId: string | number) {
    const res = await this.client.get(`/destination/sub-district/${districtId}`)
    return res.data
  }
}
