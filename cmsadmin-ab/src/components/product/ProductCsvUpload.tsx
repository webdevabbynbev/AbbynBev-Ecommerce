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
type BackendError = { row?: number; message?: string; name?: string } | any

// ✅ schema 1: template lama
const REQUIRED_HEADERS_TEMPLATE = ['name', 'category_type_id'] as const

// ✅ schema 2: master file (header Indonesia)
const REQUIRED_HEADERS_MASTER = ['nama produk', 'sku master', 'sku varian 1'] as const

function normalizeHeader(h: string) {
  return (h || '').replace(/^\uFEFF/, '').trim().toLowerCase()
}

function normalizeHeaders(fields: string[]) {
  return fields.map((f) => String(f || '').replace(/^\uFEFF/, '').trim())
}

function isMasterHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader)
  return REQUIRED_HEADERS_MASTER.every((h) => norm.includes(h))
}

function isTemplateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader)
  return REQUIRED_HEADERS_TEMPLATE.every((h) => norm.includes(h))
}

function validateHeaders(fields: string[]) {
  const norm = fields.map(normalizeHeader)

  const missTemplate = REQUIRED_HEADERS_TEMPLATE.filter((h) => !norm.includes(h))
  const missMaster = REQUIRED_HEADERS_MASTER.filter((h) => !norm.includes(h))

  const okTemplate = missTemplate.length === 0
  const okMaster = missMaster.length === 0

  if (okTemplate || okMaster) return null

  return `Header CSV tidak cocok format.
Template wajib: ${REQUIRED_HEADERS_TEMPLATE.join(', ')}.
Master wajib: ${REQUIRED_HEADERS_MASTER.join(', ')}`
}

// ===== Row validation TEMPLATE =====
function validateRowsTemplate(rows: CsvRow[]) {
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2

    const name = (row.name || '').trim()
    const categoryId = (row.category_type_id || '').trim()
    const basePrice = (row.base_price || '').trim()
    const weight = (row.weight || '').trim()
    const isFlash = (row.is_flash_sale || '').trim()

    if (!name) errors.push(`Baris ${rowNumber}: name wajib diisi`)
    if (!categoryId || isNaN(Number(categoryId))) errors.push(`Baris ${rowNumber}: category_type_id harus angka`)

    // base_price optional, tapi kalau ada harus valid
    if (basePrice !== '' && (isNaN(Number(basePrice)) || Number(basePrice) < 0)) {
      errors.push(`Baris ${rowNumber}: base_price harus angka ≥ 0 (atau kosongin)`)
    }

    if (weight !== '' && (isNaN(Number(weight)) || Number(weight) < 0)) {
      errors.push(`Baris ${rowNumber}: weight harus angka ≥ 0`)
    }

    if (isFlash !== '' && !['0', '1'].includes(isFlash)) {
      errors.push(`Baris ${rowNumber}: is_flash_sale harus 0 atau 1`)
    }
  })

  return errors
}

// ===== Row validation MASTER (yang penting aja biar gak ngeblok) =====
// ✅ di mode MASTER: kita cuma wajibkan "Nama Produk"
// ✅ SKU Varian 1 boleh kosong -> backend akan bikin fallback
function validateRowsMaster(rows: CsvRow[]) {
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2

    const namaProduk = (row['Nama Produk'] || row['nama produk'] || '').trim()

    if (!namaProduk) errors.push(`Baris ${rowNumber}: "Nama Produk" wajib diisi`)

    // OPTIONAL (kalau kamu mau warning tapi gak ngeblok):
    // const skuVar1 = (row['SKU Varian 1'] || row['sku varian 1'] || '').trim()
    // if (!skuVar1) console.warn(`Baris ${rowNumber}: "SKU Varian 1" kosong (akan dibuat otomatis oleh backend)`)
  })

  return errors
}

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
  const [csvMode, setCsvMode] = useState<'template' | 'master' | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15

  useEffect(() => {
    if (!open) resetState()
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
    setCsvMode(null)
    setCurrentPage(1)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(f: File) {
    setFile(f)
    setBackendErrors([])
    setProgress(0)
    setCurrentPage(1)

    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => String(h || '').replace(/^\uFEFF/, '').trim(),
      complete: (result) => {
        const fields = result.meta.fields || []
        const headerErr = validateHeaders(fields)

        const cleanedHeaders = normalizeHeaders(fields)
        setHeaders(cleanedHeaders)

        if (headerErr) {
          setHeaderError(headerErr)
          setPreview([])
          setRowErrors([])
          setCsvMode(null)
          return
        }

        // ✅ mode: cukup cek MASTER atau TEMPLATE
        const mode: 'master' | 'template' = isMasterHeaders(fields) ? 'master' : 'template'
        setCsvMode(mode)
        setHeaderError(null)

        // ✅ trim value tiap cell
        const cleanedData = (result.data || []).map((row) => {
          const out: CsvRow = {}
          cleanedHeaders.forEach((h) => {
            out[h] = String((row as any)?.[h] ?? '').trim()
          })
          return out
        })

        setPreview(cleanedData)

        // ✅ validasi sesuai mode
        const errs = mode === 'master' ? validateRowsMaster(cleanedData) : validateRowsTemplate(cleanedData)
        setRowErrors(errs)
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

      // ✅ importProductCSV return response.data
      const errs = result?.errors
      if (Array.isArray(errs) && errs.length) {
        setBackendErrors(errs)
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

      setBackendErrors(err?.errors || err?.response?.data?.errors || [])
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const canUpload = useMemo(() => {
    return !!file && !loading && !headerError && rowErrors.length === 0
  }, [file, loading, headerError, rowErrors.length])

  const totalPages = Math.ceil(preview.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = preview.slice(startIndex, endIndex)

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

          <Dialog.Description style={{ marginBottom: 12, color: '#858080' }}>
            Bisa upload 2 format:
            <br />
            <b>Template</b>: <code>name</code>, <code>category_type_id</code> (base_price optional)
            <br />
            <b>Master</b>: <code>Nama Produk</code>, <code>SKU Master</code>, <code>SKU Varian 1</code> (SKU Varian 1 boleh kosong)
            {csvMode ? (
              <>
                <br />
                Detected mode: <b>{csvMode.toUpperCase()}</b>
              </>
            ) : null}
          </Dialog.Description>

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
                border: '1px solid #0d0d0d',
                background: '#ddd5d5',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Pilih File CSV
            </button>

            <div style={{ fontSize: 13, color: '#333' }}>
              {file ? (
                <>
                  <b>{file.name}</b>{' '}
                  <span style={{ color: '#777' }}>({Math.round(file.size / 1024)} KB)</span>
                </>
              ) : (
                <span style={{ color: '#861212' }}>Belum ada file dipilih</span>
              )}
            </div>
          </div>

          {headerError && (
            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: '#ffecec',
                color: '#a40000',
                fontSize: 13,
                whiteSpace: 'pre-line',
              }}
            >
              {headerError}
            </div>
          )}

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
                Ada error di CSV (menampilkan max 15):
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {rowErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

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
                Error dari server (menampilkan max 15):
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
                  {currentRows.map((row, i) => (
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
                Preview menampilkan {currentRows.length} baris dari halaman {currentPage}.
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, paddingBottom: 10 }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid #ddd',
                      background: currentPage === 1 ? '#f0f0f0' : '#fff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: 12 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid #ddd',
                      background: currentPage === totalPages ? '#f0f0f0' : '#fff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #810505',
                background: '#e9e7e7',
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
                border: '1px solid #89081e',
                background: canUpload ? '#992a2e' : '#c7b7f3',
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