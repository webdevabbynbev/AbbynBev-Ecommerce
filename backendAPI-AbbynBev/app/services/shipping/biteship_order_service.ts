// app/services/shipping/biteship_order_service.ts
import env from '#start/env'
import BiteshipService from '#services/biteship_service'
import { pickFirstString, toPostalNumber } from '../../utils/address.js'
import { toNumber } from '../../utils/number.js'
import { TransactionStatus } from '../../enums/transaction_status.js'
import CompanyProfileService from './company_profile.js'

const companyProfileService = new CompanyProfileService()

export class BiteshipOrderService {
  async createReceiptForTransaction(trx: any, transaction: any) {
    const shipment: any = transaction.shipments?.[0]
    if (!shipment) throw new Error('Shipment not found.')

    // ✅ kompatibel model baru/lama
    const existingResi = String(shipment.resiNumber ?? shipment.resi_number ?? '').trim()
    if (existingResi) throw new Error('Resi sudah ada untuk transaksi ini.')

    const user: any = transaction.ecommerce?.user
    const userAddress: any = transaction.ecommerce?.userAddress
    if (!user || !userAddress) throw new Error('User address not found.')

    const totalWeight = (transaction.details || []).reduce((acc: number, d: any) => {
      const productWeight = Number(d.product?.weight || 0)
      const qty = Number(d.qty || 0)
      return acc + productWeight * qty
    }, 0)

    const { originAreaId, originPostal, originContactName, originContactPhone, originAddress } =
      companyProfileService.getCompanyOrigin()

    const destAreaId = pickFirstString(userAddress, [
      'biteshipAreaId',
      'biteship_area_id',
      'destinationAreaId',
      'destination_area_id',
      'areaId',
      'area_id',
    ])

    const destPostal = toPostalNumber(
      pickFirstString(userAddress, [
        'postalCode',
        'postal_code',
        'zipCode',
        'zip',
        'kodePos',
        'kode_pos',
      ])
    )

    if (!destAreaId && !destPostal) {
      throw new Error(
        'Alamat customer harus punya biteship area_id atau postal_code (kode pos) untuk create order Biteship.'
      )
    }

    // ✅ FIX UTAMA: picPhone (model baru) + pic_phone (lama)
    const destinationContactName = String(
      pickFirstString(shipment, ['pic']) ||
        pickFirstString(user, ['fullName', 'full_name', 'name']) ||
        'Customer'
    ).trim()

    const destinationContactPhone = String(
      pickFirstString(shipment, ['picPhone', 'pic_phone', 'phone']) ||
        pickFirstString(userAddress, ['phone', 'receiverPhone', 'receiver_phone', 'picPhone', 'pic_phone']) ||
        pickFirstString(user, ['phone', 'phoneNumber', 'phone_number']) ||
        ''
    ).trim()

    // ✅ alamat: prioritas shipment.address (karena itu yang dipakai saat checkout), fallback ke userAddress
    const destinationAddress = String(
      pickFirstString(shipment, ['address']) ||
        pickFirstString(userAddress, ['address', 'line1', 'addressLine1', 'detail', 'fullAddress']) ||
        ''
    ).trim()

    if (!destinationContactPhone || !destinationAddress) {
      throw new Error('PIC phone / alamat tujuan wajib ada untuk create order Biteship.')
    }

    const items = (transaction.details || []).map((d: any) => {
      const price = Number(d.variant?.price ?? d.price ?? 0)
      const weight = Number(d.product?.weight ?? 0) || 1
      return {
        name: d.product?.name || 'Item',
        description: d.product?.description || undefined,
        category: 'beauty',
        value: Math.max(0, Math.round(price)),
        quantity: Math.max(1, toNumber(d.qty, 1)),
        weight: Math.max(1, Math.round(weight)),
        length: Number(d.variant?.length) || undefined,
        width: Number(d.variant?.width) || undefined,
        height: Number(d.variant?.height) || undefined,
        sku: d.variant?.sku || undefined,
      }
    })

    if (!items.length) throw new Error('Order items kosong.')

    // ✅ kompatibel serviceType / service_type
    const courierCompany = String(shipment.service || '').trim().toLowerCase()
    const courierType = String(shipment.serviceType ?? shipment.service_type ?? '').trim().toLowerCase()

    if (!courierCompany || !courierType) {
      throw new Error('Courier company / type kosong di shipment. Pastikan user memilih shipping method saat checkout.')
    }

    const referenceId = String(transaction.transactionNumber || transaction.transaction_number || transaction.id)

    const biteshipPayload: any = {
      shipper_contact_name: String(env.get('COMPANY_NAME') || 'Abby n Bev'),
      shipper_contact_phone: String(env.get('COMPANY_PHONE') || originContactPhone),
      shipper_contact_email: String(env.get('COMPANY_EMAIL') || 'support@abbynbev.com'),
      shipper_organization: String(env.get('COMPANY_ORG') || 'Abby n Bev'),

      origin_contact_name: originContactName,
      origin_contact_phone: originContactPhone,
      origin_address: originAddress,
      ...(originAreaId ? { origin_area_id: originAreaId } : { origin_postal_code: originPostal }),

      destination_contact_name: destinationContactName,
      destination_contact_phone: destinationContactPhone,
      destination_contact_email: user.email || undefined,
      destination_address: destinationAddress,
      ...(destAreaId ? { destination_area_id: destAreaId } : { destination_postal_code: destPostal }),

      courier_company: courierCompany,
      courier_type: courierType,

      delivery_type: 'now',
      reference_id: referenceId,
      metadata: { transaction_id: transaction.id },

      items,
    }

    try {
      const data: any = await BiteshipService.createOrder(biteshipPayload)

      if (!data?.success) {
        throw new Error(data?.error || 'Gagal create order Biteship.')
      }

      const waybillId = data?.courier?.waybill_id
      if (!waybillId) {
        throw new Error('Waybill (resi) tidak ditemukan dari response Biteship.')
      }

      shipment.resiNumber = waybillId
      await shipment.useTransaction(trx).save()

      transaction.transactionStatus = TransactionStatus.ON_DELIVERY as any
      await transaction.useTransaction(trx).save()

      return {
        message: 'Resi berhasil dibuat (Biteship).',
        serve: {
          transaction_number: transaction.transactionNumber,
          resi_number: waybillId,
          tracking_id: data?.courier?.tracking_id,
          courier: courierCompany,
          service_type: courierType,
          total_weight: totalWeight,
        },
      }
    } catch (e: any) {
      const body = e?.response?.data

      // Case: reference_id pernah dipakai
      if (body?.code === 40002060 && body?.details?.waybill_id) {
        shipment.resiNumber = body.details.waybill_id
        await shipment.useTransaction(trx).save()

        transaction.transactionStatus = TransactionStatus.ON_DELIVERY as any
        await transaction.useTransaction(trx).save()

        return {
          message: 'Order Biteship sudah pernah dibuat (reference_id pernah dipakai).',
          serve: {
            transaction_number: transaction.transactionNumber,
            resi_number: body.details.waybill_id,
            order_id: body.details.order_id,
            total_weight: totalWeight,
          },
        }
      }

      throw new Error(body?.error || e.message || 'Gagal create order Biteship.')
    }
  }
}
