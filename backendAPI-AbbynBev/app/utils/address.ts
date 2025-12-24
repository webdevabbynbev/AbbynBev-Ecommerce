// app/utils/address.ts
export function pickFirstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  }
  return ''
}

export function toPostalNumber(v: any): number | undefined {
  const s = String(v ?? '').replace(/\D/g, '')
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}
