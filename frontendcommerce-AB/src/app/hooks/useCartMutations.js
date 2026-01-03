"use client";

import { useState } from "react";
import { deleteCartItem, updateCartQty } from "@/services/checkout/cart";
import { n } from "@/utils/number";

export function useCartMutations({ reloadCart, removeSelectedId }) {
  const [loadingItemId, setLoadingItemId] = useState(null);

  const handleUpdateQty = async (item, nextQty) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");
    const newQty = n(nextQty, 0);
    if (newQty <= 0) return;

    try {
      setLoadingItemId(item.id);
      await updateCartQty(item.id, newQty);
      await reloadCart();
    } catch (err) {
      console.warn("Error update qty:", err?.response?.data || err);
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
      await deleteCartItem(item.id);

      // sync selection localStorage
      if (removeSelectedId) removeSelectedId(item.id);

      await reloadCart();
    } catch (err) {
      console.warn("Error delete cart item:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Gagal menghapus produk dari keranjang");
    } finally {
      setLoadingItemId(null);
    }
  };

  return { loadingItemId, handleUpdateQty, handleDelete };
}
