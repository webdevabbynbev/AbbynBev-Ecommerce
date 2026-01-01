// app/utils/number.ts
export default class NumberUtils {
  public static toNumber(v: any, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  public static parseIds(input: any): number[] {
    if (!Array.isArray(input)) return []
    return input.map((x) => NumberUtils.toNumber(x)).filter((x) => x > 0)
  }
}