import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class RamadanParticipantsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const search = request.input('q', '')
    const spin = String(request.input('spin', '') || '').trim()

    try {
      const query = User.query()
        .whereHas('ramadanCheckins', () => {})
        .preload('ramadanExemptions')
        .preload('ramadanSpinTransactions', (spinQuery) => {
          spinQuery.preload('prize').orderBy('created_at', 'desc').limit(1)
        })
        .withCount('ramadanCheckins', (q) => {
          q.as('totalFasting')
        })
        .withCount('ramadanExemptions', (q) => {
          q.as('totalNotFasting')
        })

      if (search) {
        query.where((q) => {
          q.where('first_name', 'like', `%${search}%`).orWhere('last_name', 'like', `%${search}%`)
        })
      }
      if (spin) {
        if (spin === '__none__') {
          query.whereDoesntHave('ramadanSpinTransactions', () => {})
        } else {
          query.whereHas('ramadanSpinTransactions', (spinTx) => {
            spinTx.whereHas('prize', (prizeQ) => {
              prizeQ.where('name', 'like', `%${spin}%`)
            })
          })
        }
      }
      query.orderBy('created_at', 'desc')

      const users = await query.paginate(page, perPage)

      // ✅ FIX UTAMA: pastikan array native, bukan object
      const userModels = users.all()

      const formattedData = userModels.map((user: any) => {
        // alasan tidak puasa (unique)
        const reasons = user.ramadanExemptions
          ? [...new Set(user.ramadanExemptions.map((r: any) => r.reason).filter(Boolean))]
          : []

        // ✅ FIX: latestSpin sebelumnya dipakai tapi tidak didefinisikan
        const latestSpin = Array.isArray(user.ramadanSpinTransactions)
          ? user.ramadanSpinTransactions[0]
          : null

        return {
          id: user.id,
          name: user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          phone_number: user.phoneNumber,
          totalFasting: user.$extras?.totalFasting || 0,
          totalNotFasting: user.$extras?.totalNotFasting || 0,
          notFastingReasons: reasons,
          spinResult: latestSpin?.prize?.name ?? '-',
        }
      })

      return response.json({
        serve: {
          data: formattedData, // pasti Array
          total: users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: users.lastPage,
        },
      })
    } catch (error: any) {
      console.error('Error fetching ramadan participants:', error)
      return response.status(500).json({
        message: 'Failed to fetch ramadan participants',
        error: error.message,
      })
    }
  }
}
