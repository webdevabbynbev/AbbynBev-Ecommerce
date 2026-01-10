export type ProductCsvRow = {
  name?: string
  slug?: string
  master_sku?: string

  category_type_id?: string
  brand_id?: string
  persona_id?: string

  base_price?: string
  weight?: string
  is_flash_sale?: string
  status?: string

  meta_title?: string
  meta_description?: string
  meta_keywords?: string

  popularity?: string
  position?: string
}

export function validateProductCsvRow(row: ProductCsvRow) {
  /* ======================
   * REQUIRED FIELD
   * ====================== */
  if (!row.name || row.name.trim() === '') {
    throw new Error('Field "name" wajib diisi')
  }

  if (!row.category_type_id || isNaN(Number(row.category_type_id))) {
    throw new Error('Field "category_type_id" wajib diisi dan harus angka')
  }

  /* ======================
   * NUMBER FIELD
   * ====================== */
  if (row.base_price && isNaN(Number(row.base_price))) {
    throw new Error('Field "base_price" harus berupa angka')
  }

  if (row.weight && isNaN(Number(row.weight))) {
    throw new Error('Field "weight" harus berupa angka')
  }

  if (row.popularity && isNaN(Number(row.popularity))) {
    throw new Error('Field "popularity" harus berupa angka')
  }

  if (row.position && isNaN(Number(row.position))) {
    throw new Error('Field "position" harus berupa angka')
  }

  /* ======================
   * BOOLEAN FIELD (CSV)
   * ====================== */
  if (
    row.is_flash_sale &&
    !['0', '1'].includes(row.is_flash_sale)
  ) {
    throw new Error('Field "is_flash_sale" hanya boleh bernilai 0 atau 1')
  }

  /* ======================
   * ENUM FIELD
   * ====================== */
  if (
    row.status &&
    !['normal', 'war', 'draft'].includes(row.status)
  ) {
    throw new Error('Field "status" harus salah satu: normal | war | draft')
  }

  /* ======================
   * OPTIONAL FK FORMAT
   * ====================== */
  if (row.brand_id && isNaN(Number(row.brand_id))) {
    throw new Error('Field "brand_id" harus berupa angka')
  }

  if (row.persona_id && isNaN(Number(row.persona_id))) {
    throw new Error('Field "persona_id" harus berupa angka')
  }

  return true
}
