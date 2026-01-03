export default class AddressUtils {
  public static pickFirstString(obj: any, keys: string[]) {
    for (const k of keys) {
      const v = obj?.[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
      if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    }
    return ''
  }

  public static toPostalNumber(v: any): number | undefined {
    const s = String(v ?? '').replace(/\D/g, '')
    if (!s) return undefined
    const n = Number(s)
    return Number.isFinite(n) ? n : undefined
  }
}