// app/utils/number.ts
export function toNumber(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function parseIds(input: any): number[] {
  if (!Array.isArray(input)) return []
  return input.map((x) => toNumber(x)).filter((x) => x > 0)
}
