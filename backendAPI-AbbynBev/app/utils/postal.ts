// app/utils/postal.ts
export default class PostalHelper {
  public static normalizePostal(v: unknown) {
    return String(v ?? '').trim().replace(/\s+/g, '')
  }

  public static isPostalCode(v: unknown) {
    const s = PostalHelper.normalizePostal(v)
    return /^[0-9]{5}$/.test(s)
  }
}