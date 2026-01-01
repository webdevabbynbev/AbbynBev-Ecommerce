import crypto from 'crypto'

export default class Helpers {
  public static async generateSlug(value: string): Promise<string> {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  public static stripFileExtension(filename: any) {
    return filename.substring(0, filename.lastIndexOf('.')) || filename
  }

  public static replaceUrlUnsafeCharacters(filename: string) {
    return filename.replace(/[&\/\\#+$~%'":*?<>{}/\s+]/g, '_')
  }

  public static isJSON(text: string) {
    return /^[\],:{}\s]*$/.test(
      text
        .replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, '')
    )
  }

  public static formatDate(date: Date | string) {
    return date
  }

  public static generateOtp() {
    return crypto.randomInt(100000, 1000000).toString()
  }
}