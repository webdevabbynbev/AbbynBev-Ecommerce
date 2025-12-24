// app/utils/postal.ts
export function normalizePostal(v: unknown) {
  return String(v ?? '').trim().replace(/\s+/g, '')
}

export function isPostalCode(v: unknown) {
  const s = normalizePostal(v)
  return /^[0-9]{5}$/.test(s)
}
