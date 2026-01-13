"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "@/lib/axios";
import {
  MobileCartActionBar,
  Button,
  QuantityInput,
  Checkbox,
  BtnIcon,
} from "@/components";
import { formatToRupiah } from "@/utils";

const STORAGE_KEY = "checkout_selected_ids";

export default function CartClient({ initialCart }) {
  const router = useRouter();

  const [cart, setCart] = useState(
    Array.isArray(initialCart) ? initialCart : []
  );
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const toNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeCart = Array.isArray(cart) ? cart : [];

  const getQuantity = (item) =>
    toNumber(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 0, 0);

  // unit price (fallback aman)
  const getUnitPrice = (item) =>
    toNumber(
      item?.unit_price ??
        item?.unitPrice ??
        item?.price ??
        item?.product?.price ??
        0,
      0
    );

  // line total (real-time)
  const getLineTotal = (item, qty = getQuantity(item)) => {
    const amount = Number(item?.amount);
    if (Number.isFinite(amount)) return amount;
    return getUnitPrice(item) * toNumber(qty, 0);
  };

  // localStorage selection
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        setSelectedIds(parsed.map(Number).filter(Boolean));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {}
  }, [selectedIds]);

  // drop selection yang sudah tidak ada di cart
  useEffect(() => {
    const idsInCart = new Set(
      safeCart.map((x) => Number(x?.id)).filter(Boolean)
    );
    setSelectedIds((prev) =>
      prev.map(Number).filter((id) => idsInCart.has(id))
    );
  }, [safeCart]);

  const allIds = useMemo(
    () => safeCart.map((x) => Number(x?.id)).filter(Boolean),
    [safeCart]
  );

  const selectedCount = selectedIds.length;

  const selectedSubtotal = useMemo(() => {
    const set = new Set(selectedIds.map(Number));
    return safeCart
      .filter((item) => set.has(Number(item?.id)))
      .reduce((sum, item) => sum + getLineTotal(item), 0);
  }, [safeCart, selectedIds]);

  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

  const isSelected = useCallback(
    (item) => selectedIds.includes(Number(item?.id)),
    [selectedIds]
  );

  const toggleSelect = useCallback((itemId, checked) => {
    const id = Number(itemId);
    if (!id) return;

    setSelectedIds((prev) => {
      const s = new Set(prev.map(Number));
      checked ? s.add(id) : s.delete(id);
      return Array.from(s);
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked) => setSelectedIds(checked ? allIds : []),
    [allIds]
  );

  const handleUpdateQty = useCallback(
    async (item, nextQty) => {
      if (!item?.id) return alert("Cart item id tidak ditemukan");

      const newQty = toNumber(nextQty, 0);
      if (newQty <= 0) return; // biar nggak auto delete tanpa confirm

      const prevCart = cart;

      // ✅ optimistic update: qty + amount langsung berubah (real-time)
      setCart((prev) =>
        prev.map((x) =>
          Number(x.id) === Number(item.id)
            ? {
                ...x,
                qty: newQty,
                quantity: newQty,
                qtyCheckout: newQty,
                amount: getUnitPrice(x) * newQty,
              }
            : x
        )
      );

      try {
        setLoadingItemId(Number(item.id));
        const res = await axios.put(`/cart/${item.id}`, { qty: newQty });

        // kalau server balikin item terbaru, merge tanpa refetch
        const updated =
          res?.data?.data?.item || res?.data?.data || res?.data?.serve || null;
        if (updated?.id) {
          setCart((prev) =>
            prev.map((x) =>
              Number(x.id) === Number(updated.id) ? { ...x, ...updated } : x
            )
          );
        }
      } catch (err) {
        setCart(prevCart);
        alert(err?.response?.data?.message || "Gagal mengubah jumlah produk");
      } finally {
        setLoadingItemId(null);
      }
    },
    [cart]
  );

  const handleDelete = useCallback(
    async (item) => {
      if (!item?.id) return alert("Cart item id tidak ditemukan");
      if (!window.confirm("Hapus produk ini dari keranjang?")) return;

      const prevCart = cart;

      // ✅ optimistic remove: tanpa refetch cart
      setCart((prev) => prev.filter((x) => Number(x?.id) !== Number(item.id)));
      setSelectedIds((prev) =>
        prev.filter((id) => Number(id) !== Number(item.id))
      );

      try {
        setLoadingItemId(Number(item.id));
        await axios.delete(`/cart/${item.id}`);
      } catch (err) {
        setCart(prevCart);
        alert(
          err?.response?.data?.message ||
            "Gagal menghapus produk dari keranjang"
        );
      } finally {
        setLoadingItemId(null);
      }
    },
    [cart]
  );

  const handleCheckout = useCallback(async () => {
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
      alert(
        err?.response?.data?.message || "Gagal memproses checkout. Coba lagi."
      );
    } finally {
      setLoadingCheckout(false);
    }
  }, [selectedCount, selectedIds, allIds, router]);

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
                onCheckedChange={(checked) => toggleSelectAll(checked === true)}
              />
              Select all
            </label>
          </div>

          {safeCart.length === 0 && (
            <p className="text-gray-400 italic">No products in cart</p>
          )}

          {safeCart.map((item, idx) => {
            const id = item?.id;
            const product = item.product || {};
            const variantImages = Array.isArray(item?.variant?.images)
              ? item.variant.images
              : Array.isArray(item?.variant?.medias)
              ? item.variant.medias.map((m) => m?.url).filter(Boolean)
              : [];
            const variantImage =
              variantImages[0] || item?.variant?.media?.url || "";
            const image =
              variantImage ||
              product.thumbnail ||
              product.image ||
              "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

            const quantity = getQuantity(item);
            const busy = loadingItemId !== null && loadingItemId === Number(id);

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

            return (
              <div
                key={id ?? `tmp-${idx}`}
                className="flex justify-between mx-auto items-center border-b pb-4 mb-4"
              >
                <div className="flex gap-3 items-start justify-between">
                  <Checkbox
                    className="mt-2 w-4 h-4"
                    checked={!!id && isSelected(item)}
                    disabled={!id || busy || loadingCheckout}
                    onCheckedChange={(checked) =>
                      id && toggleSelect(id, checked === true)
                    }
                  />

                  <div className="flex w-full flex-col">
                    <div className="w-full flex flex-row gap-4 items-start">
                      <Image
                        src={image}
                        width={60}
                        height={60}
                        alt={productName}
                        className="rounded-sm"
                      />
                      <div className="w-full flex flex-col">
                        <p className="font-regular line-clamp-1">
                          {productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Variant: {variantName}
                        </p>
                      </div>
                      <div className="lg:hidden">
                        <Button
                          variant="tertiary"
                          size="xs"
                          disabled={busy || loadingCheckout}
                          onClick={() => handleDelete(item)}
                          className="text-xs hover:underline disabled:opacity-40"
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 w-full flex flex-row justify-between items-center">
                      <div className="hidden lg:block">
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
                      <div className="flex flex-row items-center justify-between lg:justify-end gap-6 w-full ">
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
                        <p className="font-semibold text-primary-700 text-right">
                          {formatToRupiah(getLineTotal(item, quantity))}
                        </p>
                      </div>
                    </div>
                  </div>
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
