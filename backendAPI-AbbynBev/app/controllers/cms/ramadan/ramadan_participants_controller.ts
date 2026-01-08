import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class RamadanParticipantsController {
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const search = request.input('q', '')

    try {
      // ✅ FIX: Query users yang punya checkin ramadan (minimal 1 checkin)
      const query = User.query()
        .whereHas('ramadanCheckins', (q) => {
          // Filter hanya user yang punya minimal 1 checkin
          q.whereNotNull('user_id')
        })
        .preload('ramadanExemptions')
        .withCount('ramadanCheckins', (q) => {
          q.as('totalFasting')
        })
        .withCount('ramadanExemptions', (q) => {
          q.as('totalNotFasting')
        })

      // Filter Pencarian Nama
      if (search) {
        query.where((q) => {
          q.where('first_name', 'like', `%${search}%`).orWhere('last_name', 'like', `%${search}%`)
        })
      }

      // Urutkan data
      query.orderBy('created_at', 'desc')

      const users = await query.paginate(page, perPage)

      // Format Data
      const formattedData = users.serialize().data.map((user: any) => {
        // Ambil alasan unik
        const reasons = user.ramadanExemptions
          ? [...new Set(user.ramadanExemptions.map((r: any) => r.reason))]
          : []

        return {
          id: user.id,
          name: user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          phone_number: user.phoneNumber,
          totalFasting: user.$extras?.totalFasting || 0,
          totalNotFasting: user.$extras?.totalNotFasting || 0,
          notFastingReasons: reasons,
        }
      })

      return response.json({
        data: {
          serve: {
            data: formattedData,
            total: users.total,
            perPage: users.perPage,
            currentPage: users.currentPage,
          },
        },
      })
    } catch (error) {
      console.error('Error fetching ramadan participants:', error)
      return response.status(500).json({
        message: 'Failed to fetch ramadan participants',
        error: error.message,
      })
    }
  }
}
