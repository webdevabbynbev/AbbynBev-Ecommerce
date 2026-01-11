import http from '../../api/http'

/**
 * Upload CSV product
 * @param file File CSV
 * @param onProgress callback progress (0 - 100)
 */
export function importProductCSV(
  file: File,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  formData.append('file', file)

  return http.post('/api/v1/admin/product/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total) return

      const percent = Math.round((event.loaded * 100) / event.total)
      onProgress?.(percent)
    },
  })
}
