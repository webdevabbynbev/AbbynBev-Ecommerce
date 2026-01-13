'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Papa from 'papaparse'
import { importProductCSV } from '../../services/api/product.services'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type CsvRow = Record<string, string>

// ✅ Samain dengan backend: yang wajib hanya ini
const REQUIRED_HEADERS = ['name', 'category_type_id'] as const

type BackendError = { row?: number; message?: string } | any

export default function ProductCsvUpload({ open, onOpenChange, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [rowErrors, setRowErrors] = useState<string[]>([])
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [backendErrors, setBackendErrors] = useState<BackendError[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open) resetState()
    // ❌ Jangan auto-click file picker di useEffect, sering ke-block browser
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function normalizeHeaders(fields: string[]) {
    return fields.map((f) => String(f || '').trim())
  }

  function validateHeaders(fields: string[]) {
    const normalized = normalizeHeaders(fields)
    const missing = REQUIRED_HEADERS.filter((h) => !normalized.includes(h))
    return missing.length > 0
      ? `Header CSV tidak lengkap. Kurang: ${missing.join(', ')}`
      : null
  }

  function validateRows(rows: CsvRow[]) {
    const errors: string[] = []

    rows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 karena baris 1 header

      const name = (row.name || '').trim()
      const categoryId = (row.category_type_id || '').trim()
      const basePrice = (row.base_price || '').trim()
      const weight = (row.weight || '').trim()
      const isFlash = (row.is_flash_sale || '').trim()

      if (!name) {
        errors.push(`Baris ${rowNumber}: name wajib diisi`)
      }

      if (!categoryId || isNaN(Number(categoryId))) {
        errors.push(`Baris ${rowNumber}: category_type_id harus angka`)
      }

      // ✅ base_price optional, tapi kalau ada harus valid
      if (basePrice !== '' && (isNaN(Number(basePrice)) || Number(basePrice) < 0)) {
        errors.push(`Baris ${rowNumber}: base_price harus angka ≥ 0 (atau kosongin)`)
      }

      // optional
      if (weight !== '' && (isNaN(Number(weight)) || Number(weight) < 0)) {
        errors.push(`Baris ${rowNumber}: weight harus angka ≥ 0`)
      }

      if (isFlash !== '' && !['0', '1'].includes(isFlash)) {
        errors.push(`Baris ${rowNumber}: is_flash_sale harus 0 atau 1`)
      }
    })

    return errors
  }

  function handleFileChange(f: File) {
    setFile(f)
    setBackendErrors([])
    setProgress(0)

    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => String(h || '').trim(), // ✅ trim header biar gak ke-detect salah
      complete: (result) => {
        const fields = result.meta.fields || []
        const headerErr = validateHeaders(fields)

        if (headerErr) {
          setHeaderError(headerErr)
          setHeaders(normalizeHeaders(fields))
          setPreview([])
          setRowErrors([])
          return
        }

        const cleanedHeaders = normalizeHeaders(fields)
        setHeaderError(null)
        setHeaders(cleanedHeaders)

        // ✅ trim value tiap cell biar rapi
        const cleanedData = (result.data || []).map((row) => {
          const out: CsvRow = {}
          cleanedHeaders.forEach((h) => {
            out[h] = String((row as any)?.[h] ?? '').trim()
          })
          return out
        })

        setPreview(cleanedData)
        setRowErrors(validateRows(cleanedData))
      },
      error: (err) => {
        console.error('CSV PARSE ERROR:', err)
        alert('Gagal membaca file CSV')
      },
    })
  }

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

    try {
      setLoading(true)
      setProgress(0)
      setBackendErrors([])

      const result = await importProductCSV(file, setProgress)

      // ✅ kompatibel sama response backend kamu
      const errors = result?.data?.errors
      if (Array.isArray(errors) && errors.length) {
        setBackendErrors(errors)
        alert('Import selesai, namun ada data yang gagal. Lihat error list.')
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
}

  const canUpload = useMemo(() => {
    return !!file && !loading && !headerError && rowErrors.length === 0
  }, [file, loading, headerError, rowErrors.length])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 999,
          }}
        />

        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 1100,
            maxHeight: '85vh',
            overflowY: 'auto',
            background: '#fff',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <Dialog.Title style={{ marginBottom: 12, fontSize: 18, fontWeight: 700 }}>
            Upload Product CSV
          </Dialog.Title>

          <Dialog.Description style={{ marginBottom: 12, color: '#555' }}>
            Minimal header: <b>name</b>, <b>category_type_id</b>. (base_price boleh kosong)
          </Dialog.Description>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileChange(f)
            }}
          />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Pilih File CSV
            </button>

            <div style={{ fontSize: 13, color: '#333' }}>
              {file ? (
                <>
                  <b>{file.name}</b> <span style={{ color: '#777' }}>({Math.round(file.size / 1024)} KB)</span>
                </>
              ) : (
                <span style={{ color: '#777' }}>Belum ada file dipilih</span>
              )}
            </div>
          </div>

          {/* Header Error */}
          {headerError && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: '#ffecec',
                color: '#a40000',
                fontSize: 13,
              }}
            >
              {headerError}
            </div>
          )}

          {/* Frontend row errors */}
          {rowErrors.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: '#fff6d6',
                color: '#7a5b00',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Ada error di CSV (menampilkan max 10):
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {rowErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Backend errors */}
          {backendErrors.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: '#ffecec',
                color: '#a40000',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Error dari server (menampilkan max 10):
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {backendErrors.slice(0, 10).map((e: any, i) => (
                  <li key={i}>
                    {e?.row ? <>Baris {e.row}: </> : null}
                    {e?.message ? e.message : JSON.stringify(e)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {preview.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                border: '1px solid #e5e5e5',
                borderRadius: 10,
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f5f5f5' }}>
                  <tr>
                    {headers.map((h) => (
                      <th
                        key={h}
                        style={{
                          borderBottom: '1px solid #e5e5e5',
                          padding: '8px 10px',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td
                          key={h}
                          style={{
                            borderBottom: '1px solid #f0f0f0',
                            padding: '8px 10px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: 10, fontSize: 12, color: '#777' }}>
                Preview menampilkan max 10 baris.
              </div>
            </div>
          )}

          {/* Progress */}
          {loading && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 8, width: '100%', background: '#eee', borderRadius: 999 }}>
                <div
                  style={{
                    height: 8,
                    width: `${progress}%`,
                    background: '#6d28d9',
                    borderRadius: 999,
                    transition: 'width 120ms linear',
                  }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>{progress}%</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!canUpload}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #6d28d9',
                background: canUpload ? '#6d28d9' : '#c7b7f3',
                color: '#fff',
                cursor: canUpload ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
