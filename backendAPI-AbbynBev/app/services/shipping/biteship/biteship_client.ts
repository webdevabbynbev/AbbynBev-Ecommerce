import axios, { type AxiosInstance } from 'axios'
import env from '#start/env'

export class BiteshipClient {
  private client: AxiosInstance

  constructor() {
    const baseURL = env.get('BITESHIP_BASE_URL') || 'https://api.biteship.com'
    const apiKey = env.get('BITESHIP_API_KEY')

    this.client = axios.create({
      baseURL: `${baseURL}/v1`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    })
  }

  get http() {
    return this.client
  }
}
