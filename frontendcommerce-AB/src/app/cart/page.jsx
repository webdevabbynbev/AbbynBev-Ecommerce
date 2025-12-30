"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Image from "next/image";

const STORAGE_KEY = "checkout_selected_ids";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // ✅ selection local
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState(null);

  const toNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const getQuantity = (item) =>
    toNumber(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 0, 0);

  const loadCart = async () => {
    try {
      setLoadingCart(true);
      const res = await axios.get("/cart");
      const items = res.data?.data?.items || res.data?.data || [];
      const arr = Array.isArray(items) ? items : [];
      setCart(arr);
    } catch (err) {
      console.error("Error load cart:", err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSelectedIds(parsed);
    } catch {
      // ignore
    }
  }, []);

  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore
    }
  }, [selectedIds]);

  const safeCart = Array.isArray(cart) ? cart : [];

  useEffect(() => {
    const idsInCart = new Set(safeCart.map((x) => x?.id).filter(Boolean));
    setSelectedIds((prev) => prev.filter((id) => idsInCart.has(id)));

  }, [safeCart.length]);

  const isSelected = (item) => selectedIds.includes(item?.id);

  const allIds = useMemo(
    () => safeCart.map((x) => x?.id).filter(Boolean),
    [safeCart]
  );

  const selectedCount = selectedIds.length;

  const selectedSubtotal = useMemo(() => {
    return safeCart
      .filter((item) => selectedIds.includes(item?.id))
      .reduce((sum, item) => sum + toNumber(item.amount ?? 0, 0), 0);
  }, [safeCart, selectedIds]);

  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

  const handleUpdateQty = async (item, nextQty) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");

    const newQty = toNumber(nextQty, 0);

    // qty <= 0 anggap hapus
    if (newQty <= 0) {
      await handleDelete(item);
      return;
    }

    try {
      setLoadingItemId(item.id);
      await axios.put(`/cart/${item.id}`, { qty: newQty });
      await loadCart();
    } catch (err) {
      console.error("Error update qty:", err);
      alert(err?.response?.data?.message || "Gagal mengubah jumlah produk");
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");
    if (!window.confirm("Hapus produk ini dari keranjang?")) return;

    try {
      setLoadingItemId(item.id);
      await axios.delete(`/cart/${item.id}`);

      setSelectedIds((prev) => prev.filter((id) => id !== item.id));

      await loadCart();
    } catch (err) {
      console.error("Error delete cart item:", err);
      alert(err?.response?.data?.message || "Gagal menghapus produk dari keranjang");
    } finally {
      setLoadingItemId(null);
    }
  };

  const toggleSelect = (itemId, checked) => {
    if (!itemId) return;

    setSelectedIds((prev) => {
      const s = new Set(prev);
      checked ? s.add(itemId) : s.delete(itemId);
      return Array.from(s);
    });
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? allIds : []);
  };

  const handleCheckout = () => {
    if (selectedCount === 0) {
      alert("Pilih minimal 1 produk untuk checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cart</h1>

        <button
          onClick={handleCheckout}
          disabled={selectedCount === 0}
          className="px-5 py-2 rounded-full bg-pink-600 text-white font-semibold disabled:opacity-40"
        >
          Checkout ({selectedCount})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* LEFT */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="w-5 h-5 accent-pink-600 cursor-pointer"
                checked={allSelected}
                disabled={loadingCart}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              Select all
            </label>
          </div>

          {loadingCart && <p className="text-gray-400 italic">Loading cart...</p>}

          {!loadingCart && safeCart.length === 0 && (
            <p className="text-gray-400 italic">No products in cart</p>
          )}

          {safeCart.map((item, idx) => {
            const id = item?.id;
            const product = item.product || {};
            const image =
              product.thumbnail ||
              product.image ||
              "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png";
            const quantity = getQuantity(item);

            const busy = loadingItemId !== null && loadingItemId === id;

            const productName =
              product.name || product.title || item.product_name || item.productName || "-";

            const variantName =
              item?.variant?.name ||
              item?.variant?.sku ||
              item?.variant?.code ||
              item?.variant_name ||
              product?.variant_name ||
              "-";

            const rowKey = id ?? `tmp-${idx}`;

            return (
              <div
                key={rowKey}
                className="flex justify-between items-center border-b pb-4 mb-4"
              >
                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    className="mt-2 w-5 h-5 accent-pink-600 cursor-pointer"
                    checked={!!id && isSelected(item)}
                    disabled={!id || busy}
                    onChange={(e) => toggleSelect(id, e.target.checked)}
                  />

                  <Image
                    src={image}
                    width={60}
                    height={60}
                    alt={productName}
                    className="rounded-md"
                  />

                  <div>
                    <p className="font-medium">{productName}</p>
                    <p className="text-sm text-gray-500">Variant: {variantName}</p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busy || quantity <= 1}
                          onClick={() => handleUpdateQty(item, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                        >
                          -
                        </button>

                        <span className="min-w-[32px] text-center">{quantity}</span>

                        <button
                          disabled={busy}
                          onClick={() => handleUpdateQty(item, quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        disabled={busy}
                        onClick={() => handleDelete(item)}
                        className="text-xs text-red-500 hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <p className="font-semibold text-pink-600 text-right">
                  Rp{" "}
                  {toNumber(item.amount ?? item.price ?? product.price ?? 0, 0).toLocaleString(
                    "id-ID"
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="w-full bg-white border rounded-2xl shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Selected item(s)</span>
              <span>{selectedCount}</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal (selected)</span>
              <span>Rp {selectedSubtotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={selectedCount === 0}
            className="w-full mt-6 py-3 bg-pink-600 text-white rounded-full font-semibold disabled:opacity-40"
          >
            Checkout
          </button>

          <p className="text-xs text-gray-400 mt-3">
            *Shipping & payment dipilih di halaman checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
