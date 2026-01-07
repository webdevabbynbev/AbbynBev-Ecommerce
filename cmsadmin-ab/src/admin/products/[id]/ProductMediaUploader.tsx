import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/http";
import helper from "../../../utils/helper";

type Variant = {
  id: number;
  sku?: string | null;
  stock?: number | null;
};

type ProductMedia = {
  id: number;
  url: string;
  slot?: string;
  variantId?: number | null;
  variant_id?: number | null;
  updatedAt?: string;
  updated_at?: string;
};

type Product = {
  id: number;
  name?: string | null;
  variants?: Variant[];
  medias?: ProductMedia[];
};

type Props = {
  productId: string;
};

function getVariantId(media: ProductMedia) {
  return media.variantId ?? media.variant_id ?? null;
}

function getSlot(media: ProductMedia) {
  return String(media.slot ?? "");
}

export default function ProductMediaUploader({ productId }: Props) {
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState<string>("");

  // ✅ preview lokal per slot (biar frame langsung berubah)
  const [slotPreview, setSlotPreview] = useState<Record<string, string>>({});

  // bulk
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [startSlot, setStartSlot] = useState<number>(1);

  const [uploadingSlot, setUploadingSlot] = useState<string>(""); // "1".."4"
  const slotInputRef = useRef<Record<string, HTMLInputElement | null>>({});

  const authHeader = () => {
    const session = helper.isAuthenticated();
    const token = session?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const session = helper.isAuthenticated();
      if (!session?.token) {
        alert("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await api.get(`/admin/product/${productId}`, {
        headers: authHeader(),
      });

      const data = (res.data?.serve ?? null) as Product | null;
      setProduct(data);

      const v = Array.isArray(data?.variants) ? data!.variants! : [];
      setVariants(v);

      // ✅ jangan reset pilihan variant kalau masih ada
      setVariantId((prev) => {
        if (!v.length) return "";
        const exists = v.some((x) => String(x.id) === String(prev));
        return exists ? prev : String(v[0].id);
      });
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || "Gagal load product/variants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const currentVariantMedias = useMemo(() => {
    const all = Array.isArray(product?.medias) ? product!.medias! : [];
    if (!variantId) return [];
    return all.filter((m) => String(getVariantId(m)) === String(variantId)).slice();
  }, [product?.medias, variantId]);

  // auto startSlot = max(slot)+1
  useEffect(() => {
    const maxSlot = currentVariantMedias.reduce((mx, m) => {
      const n = Number(getSlot(m) || 0);
      return Number.isFinite(n) ? Math.max(mx, n) : mx;
    }, 0);
    setStartSlot(maxSlot > 0 ? maxSlot + 1 : 1);
  }, [variantId, currentVariantMedias]);

  const mediaForSlot = (slot: string) => {
    const list = currentVariantMedias.filter((m) => getSlot(m) === String(slot));
    if (!list.length) return null;

    const sorted = list.sort((a, b) => {
      const ta = Date.parse(a.updatedAt ?? a.updated_at ?? "") || 0;
      const tb = Date.parse(b.updatedAt ?? b.updated_at ?? "") || 0;
      if (ta !== tb) return tb - ta;
      return (b.id || 0) - (a.id || 0);
    });

    return sorted[0];
  };

  const clearSlotPreview = (slot: string) => {
    setSlotPreview((prev) => {
      const url = prev[slot];
      if (url) URL.revokeObjectURL(url);
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  // -------------------------
  // Single upload per slot
  // -------------------------
  const uploadSingleSlot = async (slot: string, file: File) => {
    if (!productId) return alert("productId tidak valid");
    if (!variantId) return alert("Pilih variant dulu");
    if (!file) return;

    const session = helper.isAuthenticated();
    if (!session?.token) return alert("Token tidak ditemukan. Silakan login ulang.");

    setUploading(true);
    setUploadingSlot(slot);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("variant_id", String(variantId));
      fd.append("slot", String(slot));
      fd.append("type", "1");
      fd.append("alt_text", "");
      fd.append("file", file); // ✅ key: "file"

      await api.post(`/admin/product/${productId}/medias`, fd, {
        headers: {
          ...authHeader(),
          // ❌ jangan set Content-Type manual
        },
        onUploadProgress: (evt) => {
          const total = evt.total ?? 0;
          if (!total) return;
          setProgress(Math.round((evt.loaded * 100) / total));
        },
      });

      // ✅ Ambil URL Cloudinary terbaru, lalu preview lokal kita bersihkan
      await fetchProduct();
      clearSlotPreview(slot);

      alert(`Upload slot ${slot} berhasil!`);
    } catch (e: any) {
      console.error(e);
      // kalau gagal, balikin frame ke kondisi sebelumnya (hapus preview lokal)
      clearSlotPreview(slot);
      alert(e?.response?.data?.message || `Upload slot ${slot} gagal`);
    } finally {
      setUploading(false);
      setUploadingSlot("");
      setProgress(0);
    }
  };

  // ✅ begitu user pilih file, langsung tampil di frame slot (preview lokal)
  const onPickSlotFile = (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    // set preview lokal
    const localUrl = URL.createObjectURL(f);
    setSlotPreview((prev) => ({ ...prev, [slot]: localUrl }));

    // upload
    uploadSingleSlot(slot, f);
  };

  // -------------------------
  // Bulk upload
  // -------------------------
  const onPickBulkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setBulkFiles(picked.slice(0, 4));
    setProgress(0);
    e.target.value = "";
  };

  const removeBulkFile = (idx: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBulkUpload = async () => {
    if (!productId) return alert("productId tidak valid");
    if (!variantId) return alert("Pilih variant dulu");
    if (!bulkFiles.length) return alert("Pilih minimal 1 gambar");

    const session = helper.isAuthenticated();
    if (!session?.token) return alert("Token tidak ditemukan. Silakan login ulang.");

    setUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("variant_id", String(variantId));
      fd.append("type", "1");
      fd.append("startSlot", String(startSlot));
      bulkFiles.forEach((f) => fd.append("files", f)); // ✅ key: "files"

      await api.post(`/admin/product/${productId}/medias/bulk`, fd, {
        headers: { ...authHeader() },
        onUploadProgress: (evt) => {
          const total = evt.total ?? 0;
          if (!total) return;
          setProgress(Math.round((evt.loaded * 100) / total));
        },
      });

      setBulkFiles([]);
      setProgress(0);
      await fetchProduct();

      alert("Bulk upload berhasil!");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || "Bulk upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const SLOT_LIST = ["1", "2", "3", "4"];

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Product</div>
            <div style={{ fontWeight: 700 }}>
              {loading ? "Loading..." : product?.name || `#${productId}`}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#666" }}>Variants</div>
            <div style={{ fontSize: 13 }}>{variants.length ? `${variants.length} variant` : "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Pilih Variant
          </label>

          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={loading || !variants.length}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          >
            {!variants.length ? (
              <option value="">Tidak ada variant</option>
            ) : (
              variants.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  #{v.id} — {v.sku || "(no sku)"} — stock: {v.stock ?? 0}
                </option>
              ))
            )}
          </select>

          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Media disimpan dengan <b>variant_id</b> (product_id NULL).
          </div>
        </div>

        {/* Slot frames */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Existing Images (Slot 1–4)</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {SLOT_LIST.map((slot) => {
              const media = mediaForSlot(slot);
              const isThisSlotUploading = uploading && uploadingSlot === slot;

              // ✅ PRIORITAS: preview lokal -> url dari server -> kosong
              const displayUrl = slotPreview[slot] || media?.url || "";

              return (
                <div key={slot} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                    Slot {slot}
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 140,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#fafafa",
                      border: "1px dashed #ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {displayUrl ? (
                      <img
                        src={displayUrl}
                        alt={`slot-${slot}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: "#999" }}>No image</div>
                    )}

                    {isThisSlotUploading && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Uploading... {progress}%
                      </div>
                    )}
                  </div>

                  <input
                    ref={(el) => {
                      slotInputRef.current[slot] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => onPickSlotFile(slot, e)}
                    disabled={uploading}
                  />

                  <button
                    type="button"
                    onClick={() => slotInputRef.current[slot]?.click()}
                    disabled={uploading || loading || !variantId}
                    style={{
                      marginTop: 10,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #111",
                      background: "#111",
                      color: "#fff",
                      cursor: "pointer",
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    {isThisSlotUploading ? "Uploading..." : media ? "Replace" : "Upload"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bulk upload */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Bulk Upload</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
            Bulk akan mengisi slot berurutan mulai dari <b>startSlot</b>.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>startSlot</div>
              <input
                type="number"
                min={1}
                value={startSlot}
                onChange={(e) => setStartSlot(Number(e.target.value || 1))}
                disabled={uploading}
                style={{ width: 120, padding: 8, borderRadius: 8 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Files (max 4)</div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onPickBulkFiles}
                disabled={uploading}
              />
            </div>

            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={uploading || loading || !variants.length || !variantId}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: "#0b5",
                color: "#fff",
                cursor: "pointer",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading && !uploadingSlot ? "Uploading..." : "Upload Bulk"}
            </button>

            {uploading && !uploadingSlot && (
              <div style={{ fontSize: 12, color: "#666" }}>Progress: {progress}%</div>
            )}
          </div>

          {bulkFiles.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Selected files:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {bulkFiles.map((f, idx) => (
                  <div
                    key={f.name + idx}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeBulkFile(idx)}
                      disabled={uploading}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#d00",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: "#666" }}>
          Endpoint:
          <code> /admin/product/{productId}/medias</code> (single) ·
          <code> /admin/product/{productId}/medias/bulk</code> (bulk)
        </div>
      </div>
    </div>
  );
}