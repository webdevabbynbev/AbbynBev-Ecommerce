'use client'

import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Papa from 'papaparse'
import { importProductCSV } from '../../services/api/product.services'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type CsvRow = Record<string, string>

const REQUIRED_HEADERS = ['name', 'category_type_id', 'base_price']

export default function ProductCsvUpload({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [rowErrors, setRowErrors] = useState<string[]>([])
  const [headerError, setHeaderError] = useState<string | null>(null)

  // 🔥 ERROR DARI BACKEND
  const [backendErrors, setBackendErrors] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  /* ======================
   * AUTO OPEN FILE PICKER
   * ====================== */
  useEffect(() => {
    if (open) {
      setTimeout(() => fileInputRef.current?.click(), 150)
    } else {
      resetState()
    }
  }, [open])

  function resetState() {
    setFile(null)
    setPreview([])
    setHeaders([])
    setRowErrors([])
    setHeaderError(null)
    setBackendErrors([])
    setProgress(0)
    setLoading(false)
  }

  /* ======================
   * HEADER VALIDATION
   * ====================== */
  function validateHeaders(fields: string[]) {
    const missing = REQUIRED_HEADERS.filter((h) => !fields.includes(h))
    return missing.length > 0
      ? `Header CSV tidak lengkap. Kurang: ${missing.join(', ')}`
      : null
  }

  /* ======================
   * ROW VALIDATION (FRONTEND)
   * ====================== */
  function validateRows(rows: CsvRow[]) {
    const errors: string[] = []

    rows.forEach((row, index) => {
      const rowNumber = index + 2

      if (!row.name?.trim()) {
        errors.push(`Baris ${rowNumber}: name wajib diisi`)
      }

      if (!row.category_type_id || isNaN(Number(row.category_type_id))) {
        errors.push(`Baris ${rowNumber}: category_type_id harus angka`)
      }

      if (
        row.base_price === undefined ||
        isNaN(Number(row.base_price)) ||
        Number(row.base_price) < 0
      ) {
        errors.push(`Baris ${rowNumber}: base_price harus angka ≥ 0`)
      }

      if (row.weight && (isNaN(Number(row.weight)) || Number(row.weight) < 0)) {
        errors.push(`Baris ${rowNumber}: weight harus angka ≥ 0`)
      }

      if (row.is_flash_sale && !['0', '1'].includes(row.is_flash_sale)) {
        errors.push(`Baris ${rowNumber}: is_flash_sale harus 0 atau 1`)
      }
    })

    return errors
  }

  /* ======================
   * HANDLE FILE PICK
   * ====================== */
  function handleFileChange(file: File) {
    setFile(file)
    setBackendErrors([])

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const fields = result.meta.fields || []
        const headerErr = validateHeaders(fields)

        if (headerErr) {
          setHeaderError(headerErr)
          setPreview([])
          return
        }

        setHeaderError(null)
        setHeaders(fields)
        setPreview(result.data)
        setRowErrors(validateRows(result.data))
      },
      error: (err) => {
        console.error('CSV PARSE ERROR:', err)
        alert('Gagal membaca file CSV')
      },
    })
  }

  /* ======================
   * UPLOAD (TRY–CATCH FIX)
   * ====================== */
  async function handleUpload() {
  if (!file || headerError || rowErrors.length > 0) {
    alert('Masih ada error pada data CSV')
    return
  }

  try {
    setLoading(true)
    setProgress(0)
    setBackendErrors([])

    const result = await importProductCSV(file, setProgress)

    if (result?.data?.errors?.length) {
      setBackendErrors(result.data.errors)
      alert('Import selesai, namun ada data yang gagal')
      return
    }

    alert('Upload CSV berhasil')
    onSuccess?.()
    onOpenChange(false)
  } catch (err: any) {
    console.error('CSV UPLOAD ERROR:', err)

    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Upload CSV gagal'

    setBackendErrors(err?.response?.data?.errors || [])
    alert(message)
  } finally {
    setLoading(false)
  }
}

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />

        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 w-[90vw] max-w-5xl max-h-[85vh]
          -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow overflow-y-auto"
        >
          <Dialog.Description className="sr-only">
            Form upload CSV produk dengan validasi dan preview data
          </Dialog.Description>

          <Dialog.Title className="mb-4 text-lg font-semibold">
            Upload Product CSV
          </Dialog.Title>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) =>
              e.target.files && handleFileChange(e.target.files[0])
            }
            className="mb-4"
          />

          {/* HEADER ERROR */}
          {headerError && (
            <div className="mb-3 rounded bg-red-100 p-3 text-sm text-red-700">
              {headerError}
            </div>
          )}

          {/* FRONTEND ROW ERRORS */}
          {rowErrors.length > 0 && (
            <div className="mb-3 rounded bg-yellow-100 p-3 text-sm text-yellow-800">
              <ul className="list-disc pl-5">
                {rowErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* BACKEND ERRORS 🔥 */}
          {backendErrors.length > 0 && (
            <div className="mb-3 rounded bg-red-100 p-3 text-sm text-red-700">
              <p className="font-semibold mb-1">Error dari server:</p>
              <ul className="list-disc pl-5">
                {backendErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Baris {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PREVIEW */}
          {preview.length > 0 && (
            <div className="mb-4 overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="border px-3 py-2 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="border px-3 py-2">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PROGRESS */}
          {loading && (
            <div className="mb-3">
              <div className="h-2 w-full bg-gray-200 rounded">
                <div
                  className="h-2 bg-purple-600 rounded transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">{progress}%</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handleUpload}
              disabled={!file || loading || !!headerError || rowErrors.length > 0}
              className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
