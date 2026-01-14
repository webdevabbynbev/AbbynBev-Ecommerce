// app/services/product_csv_import_services.ts
import Database from '@adonisjs/lucid/services/db'
import csv from 'csv-parser'
import fs from 'fs'
import * as slugifyLib from 'slugify'
import { DateTime } from 'luxon'

import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ProductMedia from '#models/product_media'
import ProductOnline from '#models/product_online'

import CategoryType from '#models/category_type'
import Brand from '#models/brand'
import Tag from '#models/tag'

import Concern from '#models/concern'
import ConcernOption from '#models/concern_option'

import Attribute from '#models/attribute'
import AttributeValue from '#models/attribute_value'

import { validateProductCsvRow } from '#validators/product_csv.validator'

type ImportError = { row: number | string; name?: string; message: string }

type PivotMeta = {
  // product_tags
  hasProductTagsTable: boolean
  productTagsTagCol: string | null
  productTagsHasStartDate: boolean
  productTagsHasEndDate: boolean
  productTagsHasCreatedAt: boolean
  productTagsHasUpdatedAt: boolean
  productTagsHasDeletedAt: boolean

  // product_concerns
  hasProductConcernsTable: boolean
  productConcernsOptionCol: string | null
  productConcernsHasCreatedAt: boolean
  productConcernsHasUpdatedAt: boolean
  productConcernsHasDeletedAt: boolean
}

export default class ProductCsvImportService {
  private slugify(text: string): string {
    const fn: any = (slugifyLib as any).default ?? slugifyLib
    return fn(String(text || '').trim(), { lower: true, strict: true })
  }

  private normalizeValue(v: any): string {
    if (v === null || v === undefined) return ''
    const s = String(v).trim()
    if (!s) return ''
    const low = s.toLowerCase()
    if (low === 'null' || low === 'undefined' || low === 'nan') return ''
    return s
  }

  private pickValue(row: any, keys: string[]): string {
    for (const k of keys) {
      const v = row?.[k]
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
  }

  private parseMoneyRp(v: string): number {
    const s = String(v || '')
    const digits = s.replace(/[^0-9]/g, '')
    return digits ? Number(digits) : 0
  }

  private splitList(v: string): string[] {
    const s = String(v || '').trim()
    if (!s) return []
    const sep = s.includes('|') ? '|' : s.includes(';') ? ';' : ','
    return s
      .split(sep)
      .map((x) => x.trim())
      .filter(Boolean)
  }

  private mapStatus(v: string): string {
    const s = String(v || '').trim().toLowerCase()
    if (!s) return 'normal'
    if (s.includes('draft')) return 'draft'
    if (s.includes('war')) return 'war'
    if (s.includes('normal') || s.includes('aktif') || s.includes('active')) return 'normal'
    return 'normal'
  }

  private async ensureUniqueSlug(
    table: 'products' | 'brands' | 'category_types' | 'tags' | 'concerns' | 'concern_options',
    baseSlug: string,
    trx: any
  ): Promise<string> {
    let slug = baseSlug || 'item'
    let i = 1
    while (true) {
      const exists = await trx.from(table).where('slug', slug).first()
      if (!exists) return slug
      i += 1
      slug = `${baseSlug}-${i}`
    }
  }

  private async resolvePivotMeta(): Promise<PivotMeta> {
    const schema = (Database as any).connection().schema as any

    // ===== product_tags =====
    const hasProductTagsTable = await schema.hasTable('product_tags')
    let productTagsTagCol: string | null = null
    let productTagsHasStartDate = false
    let productTagsHasEndDate = false
    let productTagsHasCreatedAt = false
    let productTagsHasUpdatedAt = false
    let productTagsHasDeletedAt = false

    if (hasProductTagsTable) {
      if (await schema.hasColumn('product_tags', 'tag_id')) productTagsTagCol = 'tag_id'
      else if (await schema.hasColumn('product_tags', 'tags_id')) productTagsTagCol = 'tags_id'
      else productTagsTagCol = null

      productTagsHasStartDate = await schema.hasColumn('product_tags', 'start_date')
      productTagsHasEndDate = await schema.hasColumn('product_tags', 'end_date')
      productTagsHasCreatedAt = await schema.hasColumn('product_tags', 'created_at')
      productTagsHasUpdatedAt = await schema.hasColumn('product_tags', 'updated_at')
      productTagsHasDeletedAt = await schema.hasColumn('product_tags', 'deleted_at')
    }

    // ===== product_concerns =====
    const hasProductConcernsTable = await schema.hasTable('product_concerns')
    let productConcernsOptionCol: string | null = null
    let productConcernsHasCreatedAt = false
    let productConcernsHasUpdatedAt = false
    let productConcernsHasDeletedAt = false

    if (hasProductConcernsTable) {
      const candidates = [
        'concern_option_id',
        'concern_options_id',
        'concern_option_ids',
        'concern_options_ids',
      ]
      for (const c of candidates) {
        if (await schema.hasColumn('product_concerns', c)) {
          productConcernsOptionCol = c
          break
        }
      }

      productConcernsHasCreatedAt = await schema.hasColumn('product_concerns', 'created_at')
      productConcernsHasUpdatedAt = await schema.hasColumn('product_concerns', 'updated_at')
      productConcernsHasDeletedAt = await schema.hasColumn('product_concerns', 'deleted_at')
    }

    return {
      hasProductTagsTable,
      productTagsTagCol,
      productTagsHasStartDate,
      productTagsHasEndDate,
      productTagsHasCreatedAt,
      productTagsHasUpdatedAt,
      productTagsHasDeletedAt,

      hasProductConcernsTable,
      productConcernsOptionCol,
      productConcernsHasCreatedAt,
      productConcernsHasUpdatedAt,
      productConcernsHasDeletedAt,
    }
  }

  private async getOrCreateBrandId(name: string, trx: any, cache: Map<string, number>): Promise<number | undefined> {
    const n = String(name || '').trim()
    if (!n) return undefined
    const key = n.toLowerCase()
    if (cache.has(key)) return cache.get(key)

    const exist = await Brand.query({ client: trx }).where('name', n).first()
    if (exist) {
      cache.set(key, exist.id)
      return exist.id
    }

    const baseSlug = this.slugify(n) || 'brand'
    const slug = await this.ensureUniqueSlug('brands', baseSlug, trx)

    const created = await Brand.create({ name: n, slug, isActive: 1 as any } as any, { client: trx })
    cache.set(key, created.id)
    return created.id
  }

  private async getOrCreateCategoryId(
    parent: string,
    sub1: string,
    sub2: string,
    trx: any,
    cache: Map<string, number>
  ): Promise<number | undefined> {
    const p = String(parent || '').trim()
    const s1 = String(sub1 || '').trim()
    const s2 = String(sub2 || '').trim()

    const key = `${p} > ${s1} > ${s2}`.toLowerCase()
    if (cache.has(key)) return cache.get(key)

    const upsertNode = async (name: string, parentId: number | null, level: number) => {
      const nm = String(name || '').trim()
      if (!nm) return null

      let node = await CategoryType.query({ client: trx })
        .where('name', nm)
        .where((q) => {
          if (parentId === null) q.whereNull('parent_id')
          else q.where('parent_id', parentId)
        })
        .first()

      if (node) return node

      const baseSlug = this.slugify(nm) || 'category'
      const slug = await this.ensureUniqueSlug('category_types', baseSlug, trx)

      node = await CategoryType.create({ name: nm, slug, parentId: parentId ?? null, level } as any, { client: trx })
      return node
    }

    let current: any = null
    if (p) current = await upsertNode(p, null, 1)
    if (!current) current = await upsertNode('Uncategorized', null, 1)
    if (s1) current = await upsertNode(s1, current.id, 2)
    if (s2) current = await upsertNode(s2, current.id, 3)

    const id = current?.id
    if (id) cache.set(key, id)
    return id
  }

  private async getOrCreateTagIds(tagText: string, trx: any, cache: Map<string, number>): Promise<number[]> {
    const tags = this.splitList(tagText)
    const ids: number[] = []

    for (const t of tags) {
      const key = t.toLowerCase()
      if (cache.has(key)) {
        ids.push(cache.get(key)!)
        continue
      }

      let tag = await Tag.query({ client: trx }).where('name', t).first()
      if (!tag) {
        const baseSlug = this.slugify(t) || 'tag'
        const slug = await this.ensureUniqueSlug('tags', baseSlug, trx)
        tag = await Tag.create({ name: t, slug } as any, { client: trx })
      }

      cache.set(key, tag.id)
      ids.push(tag.id)
    }

    return ids
  }

  private async getOrCreateConcernOptions(
    concernName: string,
    optionListText: string,
    trx: any,
    concernCache: Map<string, number>,
    optionCache: Map<string, number>
  ): Promise<number[]> {
    const cName = String(concernName || '').trim()
    if (!cName) return []

    const cKey = cName.toLowerCase()
    let concernId = concernCache.get(cKey)

    if (!concernId) {
      const existing = await Concern.query({ client: trx }).where('name', cName).first()
      if (existing) concernId = existing.id
      else {
        const baseSlug = this.slugify(cName) || 'concern'
        const slug = await this.ensureUniqueSlug('concerns', baseSlug, trx)
        const created = await Concern.create({ name: cName, slug } as any, { client: trx })
        concernId = created.id
      }
      concernCache.set(cKey, concernId)
    }

    const options = this.splitList(optionListText)
    const finalOptions = options.length ? options : [cName]

    const optionIds: number[] = []
    for (const opt of finalOptions) {
      const oKey = `${concernId}:${opt.toLowerCase()}`
      if (optionCache.has(oKey)) {
        optionIds.push(optionCache.get(oKey)!)
        continue
      }

      let existingOpt = await ConcernOption.query({ client: trx })
        .where('concern_id', concernId)
        .where('name', opt)
        .first()

      if (!existingOpt) {
        const baseSlug = this.slugify(opt) || 'concern-option'
        const slug = await this.ensureUniqueSlug('concern_options', baseSlug, trx)
        existingOpt = await ConcernOption.create({ concernId, name: opt, slug } as any, { client: trx })
      }

      optionCache.set(oKey, existingOpt.id)
      optionIds.push(existingOpt.id)
    }

    return optionIds
  }

  private async ensureVarianAttributeId(trx: any, cache: Map<string, number>): Promise<number> {
    const attrName = 'Varian'
    let attrId = cache.get(attrName)
    if (attrId) return attrId

    const a = await Attribute.query({ client: trx }).where('name', attrName).first()
    if (a) {
      cache.set(attrName, a.id)
      return a.id
    }

    // race-safe
    try {
      const created = await Attribute.create({ name: attrName } as any, { client: trx })
      cache.set(attrName, created.id)
      return created.id
    } catch {
      const again = await Attribute.query({ client: trx }).where('name', attrName).firstOrFail()
      cache.set(attrName, again.id)
      return again.id
    }
  }

  private async readCsv(filePath: string): Promise<{ rows: any[]; separator: string }> {
    const firstLine = (fs.readFileSync(filePath, 'utf8').split(/\r?\n/)[0] || '').trim()
    const commaCount = (firstLine.match(/,/g) || []).length
    const semiCount = (firstLine.match(/;/g) || []).length
    const separator = semiCount > commaCount ? ';' : ','

    const rows: any[] = []

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator,
            mapHeaders: ({ header }) => String(header || '').replace(/^\uFEFF/, '').trim().toLowerCase(),
            mapValues: ({ value }) => this.normalizeValue(value),
          })
        )
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })

    return { rows, separator }
  }

  private detectSchema(keys: string[]): boolean {
    return keys.includes('nama produk') && keys.includes('nama varian') && keys.includes('sku master')
  }

  private async importTemplate(rows: any[], errors: ImportError[]): Promise<{ validRows: any[] }> {
    const validRows: any[] = []

    rows.forEach((row, index) => {
      try {
        validateProductCsvRow(row)
        validRows.push({ ...row, __row: index + 1 })
      } catch (err: any) {
        errors.push({ row: index + 1, name: row?.name, message: err.message })
      }
    })

    return { validRows }
  }

  private async processTemplate(validRows: any[], trx: any): Promise<void> {
    for (const row of validRows) {
      const product = await Product.create(
        {
          name: row.name,
          slug: row.slug ? row.slug : this.slugify(row.name),
          masterSku: row.master_sku || null,
          description: row.description || null,
          basePrice: Number(row.base_price) || 0,
          weight: Number(row.weight) || 0,
          isFlashSale: String(row.is_flash_sale) === '1',
          status: row.status || 'normal',
          categoryTypeId: Number(row.category_type_id),
          brandId: row.brand_id ? Number(row.brand_id) : undefined,
          personaId: row.persona_id ? Number(row.persona_id) : undefined,
        } as any,
        { client: trx }
      )

      const online = await ProductOnline.query({ client: trx }).where('product_id', product.id).first()
      if (!online) {
        await ProductOnline.create(
          { productId: product.id, isActive: true, publishedAt: DateTime.now() as any } as any,
          { client: trx }
        )
      }
    }
  }

  private async importMaster(
    rows: any[],
    errors: ImportError[]
  ): Promise<{
    groups: Map<string, any>
    stats: {
      productCreated: number
      productUpdated: number
      variantCreated: number
      mediaCreated: number
      tagAttached: number
      concernAttached: number
      variantAttrAttached: number
      onlineCreated: number
    }
  }> {
    const groups = new Map<string, any>()
    const stats = {
      productCreated: 0,
      productUpdated: 0,
      variantCreated: 0,
      mediaCreated: 0,
      tagAttached: 0,
      concernAttached: 0,
      variantAttrAttached: 0,
      onlineCreated: 0,
    }

    rows.forEach((raw, i) => {
      const rowNo = i + 2 // header = line 1

      const brandName = this.pickValue(raw, ['brand'])
      const productName = this.pickValue(raw, ['nama produk'])
      const variantName = this.pickValue(raw, ['nama varian'])
      const masterSku = this.pickValue(raw, ['sku master'])
      const sku1 = this.pickValue(raw, ['sku varian 1'])
      const sku2 = this.pickValue(raw, ['sku varian 2'])

      const parentCat = this.pickValue(raw, ['parent kategori'])
      const sub1 = this.pickValue(raw, ['sub_kategori 1', 'sub kategori 1'])
      const sub2 = this.pickValue(raw, ['sub_kategori 2', 'sub kategori 2'])

      const statusProduk = this.pickValue(raw, ['status produk'])
      const tags = this.pickValue(raw, ['tags'])
      const concern = this.pickValue(raw, ['concern'])
      const subConcern = this.pickValue(raw, ['sub_concern 1', 'sub concern 1'])

      const stock = Number(this.pickValue(raw, ['stock'])) || 0
      const basePrice = this.parseMoneyRp(this.pickValue(raw, ['base price', 'base_price']))
      const price = this.parseMoneyRp(this.pickValue(raw, ['price']))

      const thumbnail = this.pickValue(raw, ['thumbnail'])
      const photo2 = this.pickValue(raw, ['photo 2', 'photo2'])
      const photoVariant = this.pickValue(raw, ['photo variant'])

      if (!productName) {
        errors.push({ row: rowNo, name: '', message: 'Nama Produk kosong' })
        return
      }

      const key = (masterSku || productName).trim()
      if (!key) {
        errors.push({ row: rowNo, name: productName, message: 'SKU Master kosong dan Nama Produk kosong' })
        return
      }

      const g =
        groups.get(key) ||
        ({
          productName,
          masterSku,
          brandName,
          parentCat,
          sub1,
          sub2,
          statusProduk,
          tags,
          concern,
          subConcern,
          photos: [],
          basePrice: basePrice || price || 0,
          variants: [],
        } as any)

      if (!g.basePrice && (basePrice || price)) g.basePrice = basePrice || price

      ;[thumbnail, photo2, photoVariant].forEach((p) => {
        if (p && !g.photos.includes(p)) g.photos.push(p)
      })

      g.variants.push({
        variantName: variantName || 'Default',
        sku1,
        sku2,
        stock,
        basePrice,
        price,
        photoVariant,
        __row: rowNo,
      })

      groups.set(key, g)
    })

    return { groups, stats }
  }

  // ============================================================
  // ✅ PROCESS MASTER: Product + Online + Media + Variants + AttributeValues + SYNC Tags & Concerns
  // ============================================================
  private async processMaster(groups: Map<string, any>, stats: any, trx: any, errors: ImportError[]): Promise<void> {
    const pivot = await this.resolvePivotMeta()

    const brandCache = new Map<string, number>()
    const categoryCache = new Map<string, number>()
    const tagCache = new Map<string, number>()
    const concernCache = new Map<string, number>()
    const concernOptionCache = new Map<string, number>()
    const attrCache = new Map<string, number>()

    const nowSql = DateTime.now().toSQL()

    const varianAttrId = await this.ensureVarianAttributeId(trx, attrCache)

    for (const g of groups.values()) {
      try {
        const categoryTypeId = await this.getOrCreateCategoryId(g.parentCat, g.sub1, g.sub2, trx, categoryCache)
        const brandId = await this.getOrCreateBrandId(g.brandName, trx, brandCache)

        if (!categoryTypeId) {
          errors.push({ row: '-', name: g.productName, message: 'Gagal membuat/menemukan kategori' })
          continue
        }

        // =========================
        // 1) UPSERT PRODUCT (master_sku utama, fallback name)
        // =========================
        let product: any = null
        if (g.masterSku) {
          product = await Product.query({ client: trx }).where('master_sku', g.masterSku).first()
        }
        if (!product) {
          product = await Product.query({ client: trx }).where('name', g.productName).first()
        }

        if (product) {
          product.name = g.productName
          product.basePrice = g.basePrice || 0
          product.categoryTypeId = Number(categoryTypeId)
          if (brandId) product.brandId = brandId
          product.status = this.mapStatus(g.statusProduk) as any
          await product.save()
          stats.productUpdated += 1
        } else {
          const baseSlug = this.slugify(g.productName) || 'product'
          const slug = await this.ensureUniqueSlug('products', baseSlug, trx)

          product = await Product.create(
            {
              name: g.productName,
              slug,
              masterSku: g.masterSku || null,
              description: null,
              basePrice: g.basePrice || 0,
              weight: 0,
              isFlashSale: false,
              status: this.mapStatus(g.statusProduk),
              categoryTypeId: Number(categoryTypeId),
              brandId: brandId,
            } as any,
            { client: trx }
          )
          stats.productCreated += 1
        }

        // =========================
        // 2) ENSURE PRODUCT ONLINE
        // =========================
        const existingOnline = await ProductOnline.query({ client: trx }).where('product_id', product.id).first()
        if (!existingOnline) {
          await ProductOnline.create(
            { productId: product.id, isActive: true, publishedAt: DateTime.now() as any } as any,
            { client: trx }
          )
          stats.onlineCreated += 1
        }

        // =========================
        // 3) PRODUCT MEDIA (skip duplikat)
        // =========================
        for (const url of g.photos || []) {
          const u = String(url || '').trim()
          if (!u) continue

          const exist = await ProductMedia.query({ client: trx })
            .where('product_id', product.id)
            .where('url', u)
            .first()

          if (!exist) {
            await ProductMedia.create(
              {
                productId: product.id,
                url: u,
                altText: g.productName || null,
                type: 1 as any, // ✅ integer di DB kamu
              } as any,
              { client: trx }
            )
            stats.mediaCreated += 1
          }
        }

        // =========================
        // 4) TAGS (SYNC sesuai CSV)
        // =========================
        if (pivot.hasProductTagsTable && pivot.productTagsTagCol) {
          await trx.from('product_tags').where('product_id', product.id).del()

          const tagIds = await this.getOrCreateTagIds(g.tags || '', trx, tagCache)
          const uniqTagIds = Array.from(new Set(tagIds))

          for (const tagId of uniqTagIds) {
            const payload: any = {
              product_id: product.id,
              [pivot.productTagsTagCol]: tagId,
            }
            if (pivot.productTagsHasStartDate) payload.start_date = null
            if (pivot.productTagsHasEndDate) payload.end_date = null
            if (pivot.productTagsHasDeletedAt) payload.deleted_at = null
            if (pivot.productTagsHasCreatedAt) payload.created_at = nowSql
            if (pivot.productTagsHasUpdatedAt) payload.updated_at = nowSql

            await trx.insertQuery().table('product_tags').insert(payload)
            stats.tagAttached += 1
          }
        }

        // =========================
// 5) CONCERNS (SYNC sesuai CSV) - ✅ minimal kolom biar aman
// =========================
try {
  if (pivot.hasProductConcernsTable && pivot.productConcernsOptionCol) {
    // hapus dulu biar CSV jadi source of truth
    await trx.from('product_concerns').where('product_id', product.id).delete()

    // support banyak concern dipisah (| ; ,)
    const concernNames = this.splitList(g.concern || '')
    const uniqConcernNames = Array.from(new Set(concernNames.map((x) => x.trim()).filter(Boolean)))

    for (const cName of uniqConcernNames) {
      const optionIds = await this.getOrCreateConcernOptions(
        cName,
        g.subConcern || '',
        trx,
        concernCache,
        concernOptionCache
      )

      const uniqOptIds = Array.from(new Set(optionIds))

      for (const optId of uniqOptIds) {
        // ✅ jangan kirim created_at/updated_at/deleted_at
        const payload: any = {
          product_id: product.id,
          [pivot.productConcernsOptionCol]: optId,
        }

        await trx.insertQuery().table('product_concerns').insert(payload)
        stats.concernAttached += 1
      }
    }
  }
} catch (e: any) {
  errors.push({
    row: '-',
    name: g.productName,
    message: `Concern sync gagal: ${e?.message || 'unknown error'}`,
  })
}


        // =========================
        // 6) VARIANTS + AttributeValue (opsi B, update by barcode)
        // =========================
        // dedupe by barcode (SKU Varian 2) => last row wins
        const byBarcode = new Map<string, any>()
        for (const v of g.variants || []) {
          const b = String(v.sku2 || '').trim()
          if (!b) {
            errors.push({ row: v.__row ?? '-', name: g.productName, message: 'SKU Varian 2 (barcode) kosong' })
            continue
          }
          byBarcode.set(b, v)
        }

        for (const [barcode, v] of byBarcode.entries()) {
          const sku = String(v.sku1 || '').trim() || barcode
          const stock = Number(v.stock) || 0
          const priceNum = Number(v.price || v.basePrice || g.basePrice || 0)
          const price = String(priceNum)
          const variantName = String(v.variantName || '').trim() || 'Default'

          // upsert variant
          let variant = await ProductVariant.query({ client: trx }).where('barcode', barcode).first()
          if (!variant && sku) variant = await ProductVariant.query({ client: trx }).where('sku', sku).first()

          if (variant) {
            // NOTE: ini "update & re-assign" jika barcode pernah ada di produk lain (biar row gak ketinggalan)
            variant.productId = product.id
            variant.sku = sku
            variant.barcode = barcode
            variant.price = price
            variant.stock = stock
            await variant.save()
          } else {
            variant = await ProductVariant.create(
              { productId: product.id, sku, barcode, price, stock } as any,
              { client: trx }
            )
            stats.variantCreated += 1
          }

          // foto variant sebagai media (optional)
          const pv = String(v.photoVariant || '').trim()
          if (pv) {
            const existPV = await ProductMedia.query({ client: trx })
              .where('product_id', product.id)
              .where('url', pv)
              .first()

            if (!existPV) {
              await ProductMedia.create(
                {
                  productId: product.id,
                  url: pv,
                  altText: `${g.productName} - ${variantName}`,
                  type: 1 as any,
                } as any,
                { client: trx }
              )
              stats.mediaCreated += 1
            }
          }

          // AttributeValue (Varian) nempel ke variant
          const existingAV = await AttributeValue.query({ client: trx })
            .where('attribute_id', varianAttrId)
            .where('product_variant_id', variant.id)
            .first()

          if (existingAV) {
            existingAV.value = variantName
            existingAV.deletedAt = null
            await existingAV.save()
          } else {
            await AttributeValue.create(
              { attributeId: varianAttrId, value: variantName, productVariantId: variant.id } as any,
              { client: trx }
            )
            stats.variantAttrAttached += 1
          }
        }
      } catch (e: any) {
        errors.push({
          row: '-',
          name: g?.productName,
          message: `Group gagal diproses: ${e?.message || 'unknown error'}`,
        })
      }
    }
  }

  async import(filePath: string): Promise<{
    success: boolean
    errors: Array<{ row: number | string; name?: string; message: string }>
    stats?: {
      productCreated: number
      productUpdated: number
      variantCreated: number
      mediaCreated: number
      tagAttached: number
      concernAttached: number
      variantAttrAttached: number
      onlineCreated: number
    }
  }> {
    const errors: ImportError[] = []
    const { rows } = await this.readCsv(filePath)

    if (!rows.length) {
      return { success: false, errors: [{ row: '-', message: 'File CSV kosong' }] }
    }

    const isMasterSchema = this.detectSchema(Object.keys(rows[0] || {}))

    if (isMasterSchema) {
      const { groups, stats } = await this.importMaster(rows, errors)

      await Database.transaction(async (trx) => {
        await this.processMaster(groups, stats, trx, errors)
      })

      return { success: errors.length === 0, errors, stats }
    }

    const { validRows } = await this.importTemplate(rows, errors)
    await Database.transaction(async (trx) => {
      await this.processTemplate(validRows, trx)
    })

    return { success: errors.length === 0, errors }
  }
}
