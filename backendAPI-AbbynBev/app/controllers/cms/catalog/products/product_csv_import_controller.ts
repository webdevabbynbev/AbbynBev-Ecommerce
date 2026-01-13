import type { HttpContext } from '@adonisjs/core/http'
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

function cleanupFile(filePath?: string) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {}
}

function normValue(v: any) {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  if (!s) return ''
  const low = s.toLowerCase()
  if (low === 'null' || low === 'undefined' || low === 'nan') return ''
  return s
}

function slugOf(text: string) {
  const fn: any = (slugifyLib as any).default ?? slugifyLib
  return fn(String(text || '').trim(), { lower: true, strict: true })
}


function pick(row: any, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function parseMoneyRp(v: string) {
  // "Rp16,563" -> 16563 ; "102,000" -> 102000
  const s = String(v || '')
  const digits = s.replace(/[^0-9]/g, '')
  return digits ? Number(digits) : 0
}

function splitList(v: string) {
  const s = String(v || '').trim()
  if (!s) return []
  const sep = s.includes('|') ? '|' : s.includes(';') ? ';' : ','
  return s
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean)
}

function mapStatus(v: string) {
  const s = String(v || '').trim().toLowerCase()
  if (!s) return 'normal'
  if (s.includes('draft')) return 'draft'
  if (s.includes('war')) return 'war'
  if (s.includes('normal') || s.includes('aktif') || s.includes('active')) return 'normal'
  return 'normal'
}

export default class ProductCsvImportController {
  private async ensureUniqueSlug(
    table:
      | 'products'
      | 'brands'
      | 'category_types'
      | 'tags'
      | 'concerns'
      | 'concern_options',
    baseSlug: string,
    trx: any
  ) {
    let slug = baseSlug || 'item'
    let i = 1
    while (true) {
      const exists = await trx.from(table).where('slug', slug).first()
      if (!exists) return slug
      i += 1
      slug = `${baseSlug}-${i}`
    }
  }

  private async getOrCreateBrandId(name: string, trx: any, cache: Map<string, number>) {
    const n = String(name || '').trim()
    if (!n) return undefined
    const key = n.toLowerCase()
    if (cache.has(key)) return cache.get(key)

    const exist = await Brand.query({ client: trx }).where('name', n).first()
    if (exist) {
      cache.set(key, exist.id)
      return exist.id
    }

    const baseSlug = slugOf(n) || 'brand'
    const slug = await this.ensureUniqueSlug('brands', baseSlug, trx)

    const created = await Brand.create(
      {
        name: n,
        slug,
        isActive: 1 as any,
      } as any,
      { client: trx }
    )

    cache.set(key, created.id)
    return created.id
  }

  private async getOrCreateCategoryId(
    parent: string,
    sub1: string,
    sub2: string,
    trx: any,
    cache: Map<string, number>
  ) {
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

      const baseSlug = slugOf(nm) || 'category'
      const slug = await this.ensureUniqueSlug('category_types', baseSlug, trx)

      node = await CategoryType.create(
        {
          name: nm,
          slug,
          parentId: parentId ?? null,
          level,
        } as any,
        { client: trx }
      )
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

  private async getOrCreateTagIds(tagText: string, trx: any, cache: Map<string, number>) {
    const tags = splitList(tagText)
    const ids: number[] = []

    for (const t of tags) {
      const key = t.toLowerCase()
      if (cache.has(key)) {
        ids.push(cache.get(key)!)
        continue
      }

      let tag = await Tag.query({ client: trx }).where('name', t).first()
      if (!tag) {
        const baseSlug = slugOf(t) || 'tag'
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
  ) {
    const cName = String(concernName || '').trim()
    if (!cName) return []

    const cKey = cName.toLowerCase()
    let concernId = concernCache.get(cKey)

    if (!concernId) {
      const existing = await Concern.query({ client: trx }).where('name', cName).first()
      if (existing) concernId = existing.id
      else {
        const baseSlug = slugOf(cName) || 'concern'
        const slug = await this.ensureUniqueSlug('concerns', baseSlug, trx)
        const created = await Concern.create({ name: cName, slug } as any, { client: trx })
        concernId = created.id
      }
      concernCache.set(cKey, concernId)
    }

    const options = splitList(optionListText)
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
        const baseSlug = slugOf(opt) || 'concern-option'
        const slug = await this.ensureUniqueSlug('concern_options', baseSlug, trx)
        existingOpt = await ConcernOption.create(
          { concernId, name: opt, slug } as any,
          { client: trx }
        )
      }

      optionCache.set(oKey, existingOpt.id)
      optionIds.push(existingOpt.id)
    }

    return optionIds
  }

  private async getOrCreateVariantNameAttributeValue(
    variantName: string,
    trx: any,
    attrCache: Map<string, number>,
    valCache: Map<string, number>
  ) {
    const name = String(variantName || '').trim()
    if (!name) return null

    const attrName = 'Varian'
    let attrId = attrCache.get(attrName)

    if (!attrId) {
      const a = await Attribute.query({ client: trx }).where('name', attrName).first()
      if (a) attrId = a.id
      else {
        const created = await Attribute.create({ name: attrName } as any, { client: trx })
        attrId = created.id
      }
      attrCache.set(attrName, attrId)
    }

    const key = `${attrId}:${name.toLowerCase()}`
    if (valCache.has(key)) return valCache.get(key)!

    let v = await AttributeValue.query({ client: trx })
      .where('attribute_id', attrId)
      .where('value', name)
      .first()

    if (!v) {
      v = await AttributeValue.create({ attributeId: attrId, value: name } as any, { client: trx })
    }

    valCache.set(key, v.id)
    return v.id
  }

  async import({ request, response }: HttpContext) {
    const file = request.file('file', { extnames: ['csv'], size: '20mb' })
    if (!file || !file.tmpPath) {
      return response.badRequest({ message: 'File CSV tidak ditemukan' })
    }

    const filePath = file.tmpPath
    const service = new ProductCsvImportService()

    try {
      /* ======================
       * 1️⃣ READ CSV (auto delimiter + normalize)
       * ====================== */
      const firstLine = (fs.readFileSync(filePath, 'utf8').split(/\r?\n/)[0] || '').trim()
      const commaCount = (firstLine.match(/,/g) || []).length
      const semiCount = (firstLine.match(/;/g) || []).length
      const separator = semiCount > commaCount ? ';' : ','

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(
            csv({
              separator,
              mapHeaders: ({ header }) =>
                String(header || '').replace(/^\uFEFF/, '').trim().toLowerCase(),
              mapValues: ({ value }) => normValue(value),
            })
          )
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
      })

      if (!rows.length) return response.badRequest({ message: 'File CSV kosong' })

      /* ======================
       * 2️⃣ Detect schema: MASTER vs TEMPLATE
       * ====================== */
      const keys = Object.keys(rows[0] || {})
      const isMaster =
        keys.includes('nama produk') &&
        keys.includes('nama varian') &&
        keys.includes('sku master')

      /* ======================
       * 3️⃣ TEMPLATE import (format lama)
       * ====================== */
      if (!isMaster) {
        const validRows: any[] = []

        rows.forEach((row, index) => {
          try {
            validateProductCsvRow(row)
            validRows.push({ ...row, __row: index + 1 })
          } catch (err: any) {
            errors.push({ row: index + 1, name: row?.name, message: err.message })
          }
        })

        if (!validRows.length) {
          return response.badRequest({ message: 'Semua data CSV tidak valid', errors })
        }

        const trx = await Database.transaction()
        try {
          for (const row of validRows) {
            const product = await Product.create(
              {
                name: row.name,
                slug: row.slug ? row.slug : slugOf(row.name),
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

            const online = await ProductOnline.query({ client: trx })
              .where('product_id', product.id)
              .first()
            if (!online) {
              await ProductOnline.create(
                { productId: product.id, isActive: true, publishedAt: DateTime.now() as any } as any,
                { client: trx }
              )
            }
          }
          await trx.commit()
        } catch (err: any) {
          await trx.rollback()
          return response.internalServerError({ message: 'Gagal import CSV (rollback)', error: err.message })
        }

        return response.ok({
          message: 'Import CSV selesai (template)',
          total_row: rows.length,
          success: validRows.length,
          failed: errors.length,
          errors,
        })
      }

      /* ======================
       * 4️⃣ MASTER import (file master kamu)
       * ====================== */
      const trx = await Database.transaction()

      const brandCache = new Map<string, number>()
      const categoryCache = new Map<string, number>()
      const tagCache = new Map<string, number>()
      const concernCache = new Map<string, number>()
      const concernOptionCache = new Map<string, number>()
      const attrCache = new Map<string, number>()
      const attrValCache = new Map<string, number>()

      const groups = new Map<
        string,
        {
          productName: string
          masterSku: string
          brandName: string
          parentCat: string
          sub1: string
          sub2: string
          statusProduk: string
          tags: string
          concern: string
          subConcern: string
          photos: string[]
          basePrice: number
          variants: Array<{
            variantName: string
            sku1: string
            sku2: string
            stock: number
            basePrice: number
            price: number
            photoVariant: string
            __row: number
          }>
        }
      >()

      rows.forEach((raw, i) => {
        const rowNo = i + 2 // header + 1

        const brandName = pick(raw, ['brand'])
        const productName = pick(raw, ['nama produk'])
        const variantName = pick(raw, ['nama varian'])
        const masterSku = pick(raw, ['sku master'])
        const sku1 = pick(raw, ['sku varian 1'])
        const sku2 = pick(raw, ['sku varian 2'])

        const parentCat = pick(raw, ['parent kategori'])
        const sub1 = pick(raw, ['sub_kategori 1', 'sub kategori 1'])
        const sub2 = pick(raw, ['sub_kategori 2', 'sub kategori 2'])

        const statusProduk = pick(raw, ['status produk'])
        const tags = pick(raw, ['tags'])
        const concern = pick(raw, ['concern'])
        const subConcern = pick(raw, ['sub_concern 1', 'sub concern 1'])

        const stock = Number(pick(raw, ['stock'])) || 0
        const basePrice = parseMoneyRp(pick(raw, ['base price', 'base_price']))
        const price = parseMoneyRp(pick(raw, ['price']))

        const thumbnail = pick(raw, ['thumbnail'])
        const photo2 = pick(raw, ['photo 2', 'photo2'])
        const photoVariant = pick(raw, ['photo variant'])

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

      let productCreated = 0
      let productUpdated = 0
      let variantCreated = 0
      let mediaCreated = 0
      let tagAttached = 0
      let concernAttached = 0
      let variantAttrAttached = 0
      let onlineCreated = 0

      const usedSku = new Set<string>()
      const usedBarcode = new Set<string>()

      try {
        for (const g of groups.values()) {
          const categoryTypeId = await this.getOrCreateCategoryId(g.parentCat, g.sub1, g.sub2, trx, categoryCache)
          const brandId = await this.getOrCreateBrandId(g.brandName, trx, brandCache)

          if (!categoryTypeId) {
            errors.push({ row: '-', name: g.productName, message: 'Gagal membuat/menemukan kategori' })
            continue
          }

          // upsert by master_sku
          let product: any = null
          if (g.masterSku) {
            product = await Product.query({ client: trx }).where('master_sku', g.masterSku).first()
          }

          if (product) {
            product.name = g.productName
            product.basePrice = g.basePrice || 0
            product.categoryTypeId = Number(categoryTypeId)
            if (brandId) product.brandId = brandId
            product.status = mapStatus(g.statusProduk)
            await product.save()
            productUpdated += 1
          } else {
            const baseSlug = slugOf(g.productName) || 'product'
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
                status: mapStatus(g.statusProduk),
                categoryTypeId: Number(categoryTypeId),
                brandId: brandId,
              } as any,
              { client: trx }
            )
            productCreated += 1
          }

          // product_online
          const existingOnline = await ProductOnline.query({ client: trx })
            .where('product_id', product.id)
            .first()

          if (!existingOnline) {
            await ProductOnline.create(
              { productId: product.id, isActive: true, publishedAt: DateTime.now() as any } as any,
              { client: trx }
            )
            onlineCreated += 1
          } else {
            existingOnline.isActive = true as any
            await existingOnline.save()
          }

          // medias
          for (const url of g.photos) {
            if (!url) continue

            // cek duplikat media biar gak spam
            const existsMedia = await trx
              .from('product_medias')
              .where('product_id', product.id)
              .where('url', url)
              .first()

            if (!existsMedia) {
              try {
                await ProductMedia.create(
                  { productId: product.id, url, altText: g.productName, type: 1 } as any,
                  { client: trx }
                )
                mediaCreated += 1
              } catch {
                // optional
              }
            }
          }

          // tags attach (cek dulu baru insert)
          const tagIds = await this.getOrCreateTagIds(g.tags, trx, tagCache)
          for (const tagId of tagIds) {
            const existsTag = await trx
              .from('product_tags')
              .where('product_id', product.id)
              .where('tag_id', tagId)
              .first()

            if (!existsTag) {
              await trx.table('product_tags').insert({
                product_id: product.id,
                tag_id: tagId,
                start_date: null,
                end_date: null,
                created_at: new Date(),
                updated_at: new Date(),
              })
            }
            tagAttached += 1
          }

          // concerns attach (cek dulu baru insert)
          const concernOptionIds = await this.getOrCreateConcernOptions(
            g.concern,
            g.subConcern,
            trx,
            concernCache,
            concernOptionCache
          )

          for (const optId of concernOptionIds) {
            const existsConcern = await trx
              .from('product_concerns')
              .where('product_id', product.id)
              .where('concern_option_id', optId)
              .first()

            if (!existsConcern) {
              await trx.table('product_concerns').insert({
                product_id: product.id,
                concern_option_id: optId,
              })
            }
            concernAttached += 1
          }

          // variants
          for (const v of g.variants) {
            let sku = v.sku1 || v.sku2 || `${g.masterSku || slugOf(g.productName)}-${v.__row}`
            let barcode = v.sku2 || v.sku1 || sku

            sku = String(sku).trim()
            barcode = String(barcode).trim()

            if (usedSku.has(sku)) sku = `${sku}-${v.__row}`
            if (usedBarcode.has(barcode)) barcode = `${barcode}-${v.__row}`
            usedSku.add(sku)
            usedBarcode.add(barcode)

            const price = v.price || v.basePrice || g.basePrice || 0
            const stock = Number.isFinite(v.stock) ? v.stock : 0

            let variant: any = null
            try {
              variant = await ProductVariant.create(
                { productId: product.id, sku, barcode, price, stock } as any,
                { client: trx }
              )
              variantCreated += 1
            } catch {
              errors.push({
                row: v.__row,
                name: g.productName,
                message: `Gagal create variant (sku/barcode mungkin duplikat di DB): sku=${sku} barcode=${barcode}`,
              })
              continue
            }

            // attach "Nama Varian" => variant_attributes
            try {
              const attrValId = await this.getOrCreateVariantNameAttributeValue(
                v.variantName,
                trx,
                attrCache,
                attrValCache
              )

              if (attrValId) {
                const existsVA = await trx
                  .from('variant_attributes')
                  .where('product_variant_id', variant.id)
                  .where('attribute_value_id', attrValId)
                  .first()

                if (!existsVA) {
                  await trx.table('variant_attributes').insert({
                    product_variant_id: variant.id,
                    attribute_value_id: attrValId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    deleted_at: null,
                  })
                  variantAttrAttached += 1
                }
              }
            } catch {
              // optional
            }
          }
        }

        await trx.commit()
      } catch (err: any) {
        await trx.rollback()
        return response.internalServerError({
          message: 'Gagal import MASTER CSV (rollback)',
          error: err.message,
        })
      }

      return response.ok({
        message: 'Import CSV selesai (master)',
        total_row: rows.length,
        product_created: productCreated,
        product_updated: productUpdated,
        variant_created: variantCreated,
        media_created: mediaCreated,
        tag_attached: tagAttached,
        concern_attached: concernAttached,
        variant_attr_attached: variantAttrAttached,
        online_created: onlineCreated,
        failed: errors.length,
        errors,
      })
    } finally {
      cleanupFile(filePath)
    }
  }
}