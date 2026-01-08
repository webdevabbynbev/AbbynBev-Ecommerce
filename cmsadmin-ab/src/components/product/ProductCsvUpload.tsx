'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { importProductCSV } from "../../services/api/product.services";

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ProductCsvUpload({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file) {
      alert('Pilih file CSV dulu')
      return
    }

    try {
      setLoading(true)
      await importProductCSV(file)
      alert('Upload CSV berhasil')
      onSuccess?.()
      onOpenChange(false)
      setFile(null)
    } catch (error: any) {
      alert(error?.message || 'Upload CSV gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow">
          <Dialog.Title className="mb-4 text-lg font-semibold">
            Upload Product CSV
          </Dialog.Title>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 w-full"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading}
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
