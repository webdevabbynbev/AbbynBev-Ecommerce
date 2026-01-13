import http from '../../api/http'

/**
 * Upload CSV product
 * @param file File CSV
 * @param onProgress callback progress (0 - 100)
 */
export async function importProductCSV(
  file: File,
  onProgress?: (percent: number) => void
) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await http.post(
      // ✅ jangan dobel /api/v1, karena baseURL biasanya sudah .../api/v1
      '/admin/product/import-csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          const total = event.total ?? 0
          if (!total) return
          const percent = Math.round((event.loaded * 100) / total)
          onProgress?.(percent)
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('IMPORT CSV SERVICE ERROR:', error)

    // ✅ jangan throw object "baru" doang, simpan juga status/message asli biar UI gampang debug
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal upload CSV'

    const errors = error?.response?.data?.errors || []

    throw {
      message,
      errors,
      status: error?.response?.status,
      raw: error?.response?.data,
    }
  }
}
