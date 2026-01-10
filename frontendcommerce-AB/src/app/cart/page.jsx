"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileCartActionBar } from "@/components";
import { Button } from "@/components";
import { QuantityInput } from "@/components";
import { Checkbox } from "@/components";
import { formatToRupiah } from "@/utils";
import axios from "@/lib/axios";
import Image from "next/image";

const STORAGE_KEY = "checkout_selected_ids";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

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
      const items =
        res.data?.data?.items || res.data?.data || res.data?.serve || [];
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

  // (opsional) baca selection lama (localStorage) buat UX
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

  // kalau cart berubah, drop selected yang udah gak ada
  useEffect(() => {
    const idsInCart = new Set(
      safeCart.map((x) => Number(x?.id)).filter(Boolean)
    );
    setSelectedIds((prev) =>
      prev.map(Number).filter((id) => idsInCart.has(id))
    );
  }, [safeCart]);

  const isSelected = (item) =>
    selectedIds.map(Number).includes(Number(item?.id));

  const allIds = useMemo(
    () => safeCart.map((x) => Number(x?.id)).filter(Boolean),
    [safeCart]
  );

  const selectedCount = selectedIds.length;

  const selectedSubtotal = useMemo(() => {
    const selectedSet = new Set(selectedIds.map(Number));
    return safeCart
      .filter((item) => selectedSet.has(Number(item?.id)))
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

    const prevCart = cart;

    setCart((prev) =>
      prev.map((x) =>
        Number(x.id) === Number(item.id)
          ? { ...x, qty: newQty, quantity: newQty, qtyCheckout: newQty }
          : x
      )
    );

    try {
      setLoadingItemId(item.id);
      await axios.put(`/cart/${item.id}`, { qty: newQty });
    } catch (err) {
      console.error("Error update qty:", err);
      setCart(prevCart);
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

      setSelectedIds((prev) =>
        prev.filter((id) => Number(id) !== Number(item.id))
      );

      await loadCart();
    } catch (err) {
      console.error("Error delete cart item:", err);
      alert(
        err?.response?.data?.message || "Gagal menghapus produk dari keranjang"
      );
    } finally {
      setLoadingItemId(null);
    }
  };

  const toggleSelect = (itemId, checked) => {
    const id = Number(itemId);
    if (!id) return;

    setSelectedIds((prev) => {
      const s = new Set(prev.map(Number));
      checked ? s.add(id) : s.delete(id);
      return Array.from(s);
    });
  };

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? allIds : []);
  };

  // ✅ PENTING: sync selection ke server sebelum masuk checkout
  const handleCheckout = async () => {
    if (selectedCount === 0) {
      alert("Pilih minimal 1 produk untuk checkout");
      return;
    }

    const selected = selectedIds.map(Number).filter(Boolean);
    const selectedSet = new Set(selected);
    const unselected = allIds.filter((id) => !selectedSet.has(id));

    try {
      setLoadingCheckout(true);

      await Promise.all([
        axios.post("/cart/update-selection", {
          cart_ids: selected,
          is_checkout: 2,
        }),
        axios.post("/cart/update-selection", {
          cart_ids: unselected,
          is_checkout: 1,
        }),
      ]);

      router.push("/checkout");
    } catch (err) {
      console.error("Failed update selection:", err?.response?.data || err);
      alert(
        err?.response?.data?.message || "Gagal memproses checkout. Coba lagi."
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="mx-auto px-4 w-auto py-10 lg:max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* LEFT */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox
                className="w-5 h-5"
                checked={allSelected}
                disabled={loadingCart}
                onCheckedChange={(checked) => toggleSelectAll(checked === true)}
              />
              Select all
            </label>
          </div>

          {loadingCart && (
            <p className="text-gray-400 italic">Loading cart...</p>
          )}

          {!loadingCart && safeCart.length === 0 && (
            <p className="text-gray-400 italic">No products in cart</p>
          )}

          {safeCart.map((item, idx) => {
            const id = item?.id;
            const product = item.product || {};
            const variantImages = Array.isArray(item?.variant?.images)
              ? item.variant.images
              : Array.isArray(item?.variant?.medias)
              ? item.variant.medias.map((media) => media?.url).filter(Boolean)
              : [];
            const variantImage =
              variantImages[0] || item?.variant?.media?.url || "";
            const image =
              variantImage ||
              product.thumbnail ||
              product.image ||
              "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";
            const quantity = getQuantity(item);
            const busy = loadingItemId !== null && loadingItemId === id;

            const productName =
              product.name ||
              product.title ||
              item.product_name ||
              item.productName ||
              "-";

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
                className="flex justify-between mx-auto items-center border-b pb-4 mb-4 lg:max-w-6xl xl:max-w-7xl"
              >
                <div className="flex gap-3 items-start lg:max-w-6xl xl:max-w-7xl justify-between">
                  <Checkbox
                    className="mt-2 w-4 h-4"
                    checked={!!id && isSelected(item)}
                    disabled={!id || busy || loadingCheckout}
                    onCheckedChange={(checked) => {
                      if (!id) return;
                      toggleSelect(id, checked === true);
                    }}
                  />

                  <Image
                    src={image}
                    width={60}
                    height={60}
                    alt={productName}
                    className="rounded-sm"
                  />

                  <div className="w-full flex flex-col">
                    <p className="font-medium line-clamp-1">{productName}</p>
                    <p className="text-sm text-gray-500">
                      Variant: {variantName}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <QuantityInput
                        min={1}
                        max={toNumber(
                          item?.variant?.stock ?? product?.stock ?? 999999,
                          999999
                        )}
                        value={quantity}
                        disabled={busy || loadingCheckout}
                        onChange={(newQty) => handleUpdateQty(item, newQty)}
                      />

                      <Button
                        variant="tertiary"
                        size="sm"
                        disabled={busy || loadingCheckout}
                        onClick={() => handleDelete(item)}
                        className="text-xs hover:underline disabled:opacity-40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="w-100">
                  <p className="font-semibold text-primary-700 text-right">
                    {formatToRupiah(
                      item.amount ?? item.price ?? product.price ?? 0
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="hidden w-full bg-white border rounded-2xl shadow-md p-6 h-fit lg:block">
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold">Summary</h2>

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between">
                <span>Selected item(s)</span>
                <span>{selectedCount}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal (selected)</span>
                <span>Rp {selectedSubtotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              disabled={selectedCount === 0 || loadingCheckout}
              className="w-full"
            >
              {loadingCheckout
                ? "Processing..."
                : `Checkout (${selectedCount})`}
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            *Shipping & payment dipilih di halaman checkout.
          </p>
        </div>
      </div>
      <MobileCartActionBar
        allSelected={allSelected}
        selectedCount={selectedCount}
        subtotal={selectedSubtotal}
        loadingCheckout={loadingCheckout}
        onToggleSelectAll={toggleSelectAll}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
