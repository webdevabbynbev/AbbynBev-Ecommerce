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
      '/api/v1/admin/product/import-csv',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!event.total) return
          const percent = Math.round(
            (event.loaded * 100) / event.total
          )
          onProgress?.(percent)
        },
      }
    )

    // ⬅️ PENTING: return data saja, bukan AxiosResponse
    return response.data
  } catch (error: any) {
    console.error('IMPORT CSV SERVICE ERROR:', error)

    // lempar error terstruktur ke UI
    throw {
      message:
        error?.response?.data?.message ||
        'Gagal upload CSV',
      errors: error?.response?.data?.errors || [],
    }
  }
}
