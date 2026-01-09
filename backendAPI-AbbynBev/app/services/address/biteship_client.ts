import axios, { AxiosInstance } from 'axios'
import env from '#start/env'

type CacheValue = { exp: number; data: unknown }

class InMemoryCache {
  private store = new Map<string, CacheValue>()
  private inflight = new Map<string, Promise<unknown>>()

  get(key: string) {
    const it = this.store.get(key)
    if (!it) return null
    if (Date.now() > it.exp) {
      this.store.delete(key)
      return null
    }
    return it.data
  }

  set(key: string, data: unknown, ttlMs: number) {
    this.store.set(key, { exp: Date.now() + ttlMs, data })
  }

  async cachedFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>) {
    const cached = this.get(key)
    if (cached !== null) return { data: cached as T, cached: true as const }

    const running = this.inflight.get(key)
    if (running) {
      const data = await running
      return { data: data as T, cached: true as const, coalesced: true as const }
    }

    const p: Promise<unknown> = (async () => {
      const data = await fetcher()
      this.set(key, data, ttlMs)
      return data
    })()

    this.inflight.set(key, p)

    try {
      const data = await p
      return { data: data as T, cached: false as const }
    } finally {
      this.inflight.delete(key)
    }
  }
}

function extractBiteshipError(body: any) {
  const errField = body?.error
  const msg =
    (typeof body === 'string' ? body : null) ||
    (typeof errField === 'string' ? errField : null) ||
    errField?.message ||
    body?.message ||
    (Array.isArray(body?.errors) ? body.errors.join(', ') : null)

  const code = body?.code || errField?.code || null
  return { msg, code }
}

function getCourierAll(): string {
  const s = String(env.get('BITESHIP_COURIERS') || '').trim()
  return s || 'jne,sicepat,jnt,anteraja,pos,tiki,ninja,wahana'
}

function normalizeCouriers(input: string): string {
  const raw = String(input || '').toLowerCase().trim()
  if (!raw || raw === 'all') return getCourierAll()
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',')
}

export class BiteshipClient {
  private http: AxiosInstance
  private cache = new InMemoryCache()

  private baseUrl: string
  private apiKey: string

  private TTL_SEARCH_MS = 24 * 60 * 60 * 1000
  private TTL_COST_MS = 5 * 60 * 1000

  constructor() {
    this.baseUrl = String(env.get('BITESHIP_BASE_URL') || 'https://api.biteship.com')
      .trim()
      .replace(/\/+$/, '')

    this.apiKey = String(env.get('BITESHIP_API_KEY') || '').trim()

    this.http = axios.create({
      baseURL: `${this.baseUrl}/v1`,
      headers: {
        Authorization: this.apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      timeout: 30_000,
    })
  }

  assertConfig() {
    if (!this.baseUrl || !this.apiKey) {
      const err: any = new Error('BITESHIP config missing.')
      err.httpStatus = 500
      throw err
    }
  }

  async searchAreas(params: { input: string; countries?: string; type?: string }) {
    this.assertConfig()

    const input = String(params.input || '').trim()
    if (!input) {
      const err: any = new Error('input is required')
      err.httpStatus = 400
      throw err
    }

    const countries = String(params.countries || 'ID').trim()
    const type = String(params.type || 'multi').trim()

    const cacheKey = `biteship:areas:${countries}:${type}:${input.toLowerCase()}`
    return this.cache.cachedFetch(cacheKey, this.TTL_SEARCH_MS, async () => {
      const { data } = await this.http.get('/maps/areas', { params: { countries, input, type } })
      const areas = Array.isArray((data as any)?.areas) ? (data as any).areas : []
      return areas
    })
  }

  async getCourierRates(payload: any, noCache = false) {
    this.assertConfig()

    const key = `biteship:rates:${JSON.stringify(payload)}`
    const hit = async () => {
      const { data } = await this.http.post('/rates/couriers', payload)
      return Array.isArray((data as any)?.pricing) ? (data as any).pricing : []
    }

    if (noCache) return { data: await hit(), cached: false as const, noCache: true as const }

    return this.cache.cachedFetch(key, this.TTL_COST_MS, hit)
  }

  static extractError(e: any) {
    const status = e?.response?.status || 500
    const body = e?.response?.data
    const { msg, code } = extractBiteshipError(body)
    return { status, body, msg, code }
  }

  static normalizeCouriers = normalizeCouriers
}