type ProductCsvRow = {
  name?: string
  category_type_id?: string
  base_price?: string
  weight?: string
  is_flash_sale?: string
  status?: string
}

export function validateProductCsvRow(row: ProductCsvRow) {
  if (!row.name || row.name.trim() === '') {
    throw new Error('Nama produk wajib diisi')
  }

  if (!row.category_type_id || isNaN(Number(row.category_type_id))) {
    throw new Error('category_type_id wajib dan harus angka')
  }

  if (row.base_price && isNaN(Number(row.base_price))) {
    throw new Error('base_price harus angka')
  }

  if (row.weight && isNaN(Number(row.weight))) {
    throw new Error('weight harus angka')
  }

  if (
    row.is_flash_sale &&
    !['0', '1', 0, 1].includes(row.is_flash_sale as any)
  ) {
    throw new Error('is_flash_sale hanya boleh 0 atau 1')
  }

  if (
    row.status &&
    !['normal', 'war', 'draft'].includes(row.status)
  ) {
    throw new Error('status harus: normal | war | draft')
  }

  return true
}
