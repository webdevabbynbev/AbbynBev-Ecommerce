// app/utils/http.ts
export default class HttpHelper {
  public static toInt(v: unknown, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : fallback
  }

  public static pickInput(request: any, keys: string[], fallback: any = undefined) {
    for (const k of keys) {
      const v = request.input(k)
      if (typeof v !== 'undefined' && v !== null && v !== '') return v
    }
    return fallback
  }
}