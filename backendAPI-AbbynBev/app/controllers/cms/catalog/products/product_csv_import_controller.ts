import type { HttpContext } from '@adonisjs/core/http'
import Database from '@adonisjs/lucid/services/db'
import csv from 'csv-parser'
import fs from 'fs'
import Product from '#models/product'
import CategoryType from '#models/category_type'
import Brand from '#models/brand'
import slugify from 'slugify'
import { validateProductCsvRow } from '#validators/product_csv.validator'

export default class ProductCsvImportController {
  async import({ request, response }: HttpContext) {
    const file = request.file('file', {
      extnames: ['csv'],
      size: '5mb',
    })

    if (!file || !file.tmpPath) {
      return response.badRequest({ message: 'File CSV tidak ditemukan' })
    }

    const filePath = file.tmpPath
    const rows: any[] = []
    const errors: any[] = []

    /* ======================
     * 1️⃣ READ CSV
     * ====================== */
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })

    if (rows.length === 0) {
      return response.badRequest({ message: 'File CSV kosong' })
    }

    /* ======================
     * 2️⃣ ROW VALIDATION
     * ====================== */
    const validRows: any[] = []

    rows.forEach((row, index) => {
      try {
        validateProductCsvRow(row)
        validRows.push({ ...row, __row: index + 1 })
      } catch (err: any) {
        errors.push({
          row: index + 1,
          name: row?.name,
          message: err.message,
        })
      }
    })

    if (validRows.length === 0) {
      return response.badRequest({
        message: 'Semua data CSV tidak valid',
        errors,
      })
    }

    /* ======================
     * 3️⃣ FK VALIDATION (BATCH)
     * ====================== */
    const categoryIds = [
      ...new Set(validRows.map((r) => Number(r.category_type_id))),
    ]

    const brandIds = [
      ...new Set(
        validRows
          .filter((r) => r.brand_id)
          .map((r) => Number(r.brand_id))
      ),
    ]

    const categories = await CategoryType.query().whereIn('id', categoryIds)
    const brands = brandIds.length
      ? await Brand.query().whereIn('id', brandIds)
      : []

    const categorySet = new Set(categories.map((c) => c.id))
    const brandSet = new Set(brands.map((b) => b.id))

    let fkValidRows = validRows.filter((row) => {
      if (!categorySet.has(Number(row.category_type_id))) {
        errors.push({
          row: row.__row,
          name: row.name,
          message: `category_type_id ${row.category_type_id} tidak ditemukan`,
        })
        return false
      }

      if (row.brand_id && !brandSet.has(Number(row.brand_id))) {
        errors.push({
          row: row.__row,
          name: row.name,
          message: `brand_id ${row.brand_id} tidak ditemukan`,
        })
        return false
      }

      return true
    })

    /* ======================
     * 4️⃣ DUPLICATE SKU HANDLING
     * ====================== */
    const csvSkuSet = new Set<string>()
    const csvDuplicateSku = new Set<string>()

    fkValidRows.forEach((row) => {
      if (!row.master_sku) return
      if (csvSkuSet.has(row.master_sku)) {
        csvDuplicateSku.add(row.master_sku)
      } else {
        csvSkuSet.add(row.master_sku)
      }
    })

    if (csvDuplicateSku.size > 0) {
      fkValidRows = fkValidRows.filter((row) => {
        if (csvDuplicateSku.has(row.master_sku)) {
          errors.push({
            row: row.__row,
            name: row.name,
            message: `Duplicate master_sku di CSV: ${row.master_sku}`,
          })
          return false
        }
        return true
      })
    }

    const dbSkus = (
      await Product.query()
        .whereIn('master_sku', [...csvSkuSet])
        .select('master_sku')
    ).map((p) => p.masterSku)

    const dbSkuSet = new Set(dbSkus)

    const finalRows = fkValidRows.filter((row) => {
      if (row.master_sku && dbSkuSet.has(row.master_sku)) {
        errors.push({
          row: row.__row,
          name: row.name,
          message: `master_sku sudah ada di database: ${row.master_sku}`,
        })
        return false
      }
      return true
    })

    /* ======================
     * 5️⃣ TRANSACTION + INSERT
     * ====================== */
    const trx = await Database.transaction()

    try {
      for (const row of finalRows) {
        await Product.create(
          {
            name: row.name,
            slug:
              row.slug ??
              slugify.default(row.name, { lower: true, strict: true }),

            masterSku: row.master_sku ?? null,
            description: row.description ?? null,

            basePrice: Number(row.base_price) || 0,
            weight: Number(row.weight) || 0,

            isFlashSale: row.is_flash_sale === '1',
            status: row.status ?? 'normal',

            categoryTypeId: Number(row.category_type_id),
            brandId: row.brand_id ? Number(row.brand_id) : undefined,
            personaId: row.persona_id ? Number(row.persona_id) : undefined,

            metaTitle: row.meta_title ?? null,
            metaDescription: row.meta_description ?? null,
            metaKeywords: row.meta_keywords ?? null,

            popularity: Number(row.popularity) || 0,
            position: Number(row.position) || 0,
          },
          { client: trx }
        )
      }

      await trx.commit()
    } catch (err: any) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Gagal import CSV (rollback)',
        error: err.message,
      })
    } finally {
      fs.unlinkSync(filePath)
    }

    /* ======================
     * 6️⃣ RESPONSE
     * ====================== */
    return response.ok({
      message: 'Import CSV selesai',
      total_row: rows.length,
      success: finalRows.length,
      failed: errors.length,
      errors,
    })
  }
}
