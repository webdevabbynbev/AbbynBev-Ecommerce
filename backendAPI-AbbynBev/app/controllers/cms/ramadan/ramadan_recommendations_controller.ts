import type { HttpContext } from '@adonisjs/core/http'
import RamadanProductRecommendation from '#models/ramadan_product_recommendation'
import Product from '#models/product'

export default class RamadanRecommendationsController {
  // GET: List Rekomendasi
  public async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const date = request.input('date')

    const query = RamadanProductRecommendation.query()
      .preload('product', (q) => {
        q.preload('medias') // Ambil gambar produk
      })
      .orderBy('recommendation_date', 'desc')

    if (date) {
      query.where('recommendation_date', date)
    }

    const data = await query.paginate(page, perPage)
    return response.json(data)
  }

  // POST: Tambah Rekomendasi
  public async store({ request, response }: HttpContext) {
    const payload = request.only(['product_id', 'recommendation_date'])

    // Validasi sederhana (bisa dipindah ke validator terpisah)
    if (!payload.product_id || !payload.recommendation_date) {
      return response.badRequest({ message: 'Product ID and Date are required' })
    }

    // Cek apakah produk valid
    const product = await Product.find(payload.product_id)
    if (!product) return response.notFound({ message: 'Product not found' })

    // Cek duplikasi (opsional: jika 1 produk cuma boleh 1x di hari yg sama)
    const exists = await RamadanProductRecommendation.query()
      .where('product_id', payload.product_id)
      .andWhere('recommendation_date', payload.recommendation_date)
      .first()

    if (exists) {
      return response.badRequest({ message: 'Product already recommended for this date' })
    }

    const rec = await RamadanProductRecommendation.create({
      productId: payload.product_id,
      recommendationDate: payload.recommendation_date,
      isActive: true,
    })

    return response.created({ message: 'Recommendation added', data: rec })
  }

  // DELETE: Hapus Rekomendasi
  public async destroy({ params, response }: HttpContext) {
    const rec = await RamadanProductRecommendation.find(params.id)
    if (!rec) return response.notFound({ message: 'Data not found' })

    await rec.delete()
    return response.json({ message: 'Recommendation deleted' })
  }
}
