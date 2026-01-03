// app/services/shipping/company_profile.ts
import env from '#start/env'
import AddressUtils from '../../utils/address.js'

export default class CompanyProfileService {
  public getCompanyOrigin() {
    const originAreaId = String(env.get('BITESHIP_ORIGIN_AREA_ID') || '').trim()
    const originPostal = AddressUtils.toPostalNumber(env.get('COMPANY_POSTAL_CODE'))

    if (!originAreaId && !originPostal) {
      throw new Error('Origin Biteship belum diset. Isi BITESHIP_ORIGIN_AREA_ID atau COMPANY_POSTAL_CODE')
    }

    const originContactName = String(env.get('COMPANY_CONTACT_NAME') || 'Abby n Bev Store')
    const originContactPhone = String(env.get('COMPANY_CONTACT_PHONE') || env.get('COMPANY_PHONE') || '')
    const originAddress = String(env.get('COMPANY_ADDRESS') || '')

    if (!originContactPhone || !originAddress) {
      throw new Error('COMPANY_CONTACT_PHONE/COMPANY_PHONE dan COMPANY_ADDRESS wajib ada untuk create order Biteship.')
    }

    return {
      originAreaId,
      originPostal,
      originContactName,
      originContactPhone,
      originAddress,
    }
  }
}
