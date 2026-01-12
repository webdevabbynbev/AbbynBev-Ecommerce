"use client";

import { useState } from "react";
import axios from "@/lib/axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components";

export function DeleteAddress({ address, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await axios.delete(`/addresses/${address.id}`);
      onSuccess?.();
      setOpen(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal menghapus alamat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Delete address
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            Apakah kamu yakin ingin menghapus alamat ini?
            Tindakan ini <span className="font-semibold">tidak dapat dibatalkan</span>.
          </p>

          {/* Preview alamat */}
          <div className="rounded-lg border bg-muted p-3 text-sm">
            <p className="font-medium">{address.pic_label || "Address"}</p>
            <p className="text-neutral-600">{address.address}</p>
            <p className="text-neutral-500 text-xs">
              {address.area_name} {address.postal_code && `(${address.postal_code})`}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete address"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
