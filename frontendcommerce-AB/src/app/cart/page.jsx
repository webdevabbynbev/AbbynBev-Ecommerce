"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Image from "next/image";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [loadingSelectAll, setLoadingSelectAll] = useState(false);

  const toNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const getQuantity = (item) =>
    toNumber(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 0, 0);

  const isSelected = (item) =>
    Number(item?.isCheckout ?? item?.is_checkout ?? 0) === 1;

  const loadCart = async () => {
    try {
      setLoadingCart(true);
      const res = await axios.get("/cart");
      const items = res.data?.data?.items || res.data?.data || [];
      setCart(Array.isArray(items) ? items : []);
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

  const safeCart = Array.isArray(cart) ? cart : [];

  const selectedIds = useMemo(
    () => safeCart.filter(isSelected).map((x) => x.id).filter(Boolean),
    [safeCart]
  );

  const allIds = useMemo(
    () => safeCart.map((x) => x.id).filter(Boolean),
    [safeCart]
  );

  const selectedCount = selectedIds.length;

  const selectedSubtotal = useMemo(() => {
    return safeCart
      .filter(isSelected)
      .reduce((sum, item) => sum + toNumber(item.amount ?? 0, 0), 0);
  }, [safeCart]);

  // ======================
  // UPDATE QTY
  // ======================
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

  // ======================
  // DELETE ITEM
  // ======================
  const handleDelete = async (item) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");
    if (!window.confirm("Hapus produk ini dari keranjang?")) return;

    try {
      setLoadingItemId(item.id);
      await axios.delete(`/cart/${item.id}`);
      await loadCart();
    } catch (err) {
      console.error("Error delete cart item:", err);
      alert(err?.response?.data?.message || "Gagal menghapus produk dari keranjang");
    } finally {
      setLoadingItemId(null);
    }
  };

  // ======================
  // TOGGLE SELECT (per item)
  // ======================
  const toggleSelect = async (item, checked) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");

    try {
      setLoadingItemId(item.id);
      await axios.post("/cart/update-selection", {
        cart_ids: [item.id],
        is_checkout: checked ? 1 : 0,
      });
      await loadCart();
    } catch (err) {
      console.error("Error update selection:", err);
      alert(err?.response?.data?.message || "Gagal memilih item checkout");
    } finally {
      setLoadingItemId(null);
    }
  };

  // ======================
  // SELECT ALL
  // ======================
  const toggleSelectAll = async (checked) => {
    if (allIds.length === 0) return;

    try {
      setLoadingSelectAll(true);
      await axios.post("/cart/update-selection", {
        cart_ids: allIds,
        is_checkout: checked ? 1 : 0,
      });
      await loadCart();
    } catch (err) {
      console.error("Error select all:", err);
      alert(err?.response?.data?.message || "Gagal select all");
    } finally {
      setLoadingSelectAll(false);
    }
  };

  // ======================
  // CHECKOUT
  // ======================
  const handleCheckout = () => {
    if (selectedCount === 0) {
      alert("Pilih minimal 1 produk untuk checkout");
      return;
    }
    router.push("/checkout");
  };

  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

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
                className="w-5 h-5 accent-pink-600"
                checked={allSelected}
                disabled={loadingSelectAll || loadingCart}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              Select all
            </label>

            {loadingSelectAll && (
              <span className="text-xs text-gray-400">Updating...</span>
            )}
          </div>

          {loadingCart && <p className="text-gray-400 italic">Loading cart...</p>}

          {!loadingCart && safeCart.length === 0 && (
            <p className="text-gray-400 italic">No products in cart</p>
          )}

          {safeCart.map((item) => {
            const product = item.product || {};
            const image = product.thumbnail || product.image || "/placeholder.png";
            const quantity = getQuantity(item);
            const busy = loadingItemId === item.id;

            const productName =
              product.name || product.title || item.product_name || item.productName || "-";

            const variantName =
              item?.variant?.name ||
              item?.variant?.sku ||
              item?.variant?.code ||
              item?.variant_name ||
              product?.variant_name ||
              "-";

            return (
              <div
                key={item.id}
                className="flex justify-between items-center border-b pb-4 mb-4"
              >
                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    className="mt-2 w-5 h-5 accent-pink-600"
                    checked={isSelected(item)}
                    disabled={busy}
                    onChange={(e) => toggleSelect(item, e.target.checked)}
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
            Proceed to Checkout
          </button>

          <p className="text-xs text-gray-400 mt-3">
            *Shipping & payment dipilih di halaman checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
