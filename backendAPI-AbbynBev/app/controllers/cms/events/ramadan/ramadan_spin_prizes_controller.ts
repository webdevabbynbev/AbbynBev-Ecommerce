import type { HttpContext } from '@adonisjs/core/http'
import RamadanSpinPrize from '#models/ramadan_spin_prize'

export default class RamadanSpinPrizesController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)

    const query = RamadanSpinPrize.query().orderBy('created_at', 'desc')
    const data = await query.paginate(page, perPage)

    return response.json(data)
  }

  public async store({ request, response }: HttpContext) {
    const payload = request.only(['name', 'weight', 'is_grand', 'is_active'])
    const name = String(payload.name || '').trim()

    if (!name) {
      return response.badRequest({ message: 'Nama hadiah wajib diisi.' })
    }

    const prize = await RamadanSpinPrize.create({
      name,
      weight: Number(payload.weight ?? 1),
      isGrand: Boolean(payload.is_grand),
      isActive: payload.is_active === undefined ? true : Boolean(payload.is_active),
    })

    return response.created({ message: 'Hadiah ditambahkan.', data: prize })
  }

  public async update({ request, response, params }: HttpContext) {
    const prize = await RamadanSpinPrize.find(params.id)
    if (!prize) return response.notFound({ message: 'Hadiah tidak ditemukan.' })

    const payload = request.only(['name', 'weight', 'is_grand', 'is_active'])
    const name = payload.name !== undefined ? String(payload.name).trim() : prize.name

    prize.name = name
    if (payload.weight !== undefined) prize.weight = Number(payload.weight)
    if (payload.is_grand !== undefined) prize.isGrand = Boolean(payload.is_grand)
    if (payload.is_active !== undefined) prize.isActive = Boolean(payload.is_active)

    await prize.save()

    return response.ok({ message: 'Hadiah diperbarui.', data: prize })
  }

  public async destroy({ params, response }: HttpContext) {
    const prize = await RamadanSpinPrize.find(params.id)
    if (!prize) return response.notFound({ message: 'Hadiah tidak ditemukan.' })

    await prize.delete()
    return response.ok({ message: 'Hadiah dihapus.' })
  }
}
