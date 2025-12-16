"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Image from "next/image";

const STORAGE_KEY = "checkout_selected_ids";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [address, setAddress] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState(null);

  const toNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const getQuantity = (item) =>
    toNumber(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 0, 0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSelectedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSelectedIds([]);
    }
  }, []);

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


  const loadAddress = async () => {
    try {
      const res = await axios.get("/addresses");
      const primary = res.data?.data?.find((a) => a.is_primary === 1);
      setAddress(primary || null);
    } catch (err) {
      console.error("Error load address:", err);
      setAddress(null);
    }
  };

  const loadShipping = () => {
    setShippingMethods([
      { id: "jnt", name: "J&T", price: 10800, estimate: "7 - 8 August" },
      { id: "jne", name: "JNE", price: 11200, estimate: "7 - 8 August" },
      { id: "tiki", name: "Tiki", price: 9100, estimate: "7 - 10 August" },
    ]);
  };

  useEffect(() => {
    loadCart();
    loadAddress();
    loadShipping();
  }, []);

  const safeCart = Array.isArray(cart) ? cart : [];

  const checkoutItems = useMemo(() => {
    const s = new Set(selectedIds);
    return safeCart.filter((item) => s.has(item?.id));
  }, [safeCart, selectedIds]);

  useEffect(() => {
    if (!loadingCart && selectedIds.length === 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedIds.length, router]);

  useEffect(() => {
    if (!loadingCart && selectedIds.length > 0 && checkoutItems.length === 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedIds.length, checkoutItems.length, router]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + toNumber(item.amount ?? 0, 0), 0);
  }, [checkoutItems]);

  const total = subtotal + (selectedShipping?.price || 0);

  const handleUpdateQty = async (item, nextQty) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");

    const newQty = toNumber(nextQty, 0);
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

    
      setSelectedIds((prev) => {
        const next = prev.filter((id) => id !== item.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      await loadCart();
    } catch (err) {
      console.error("Error delete cart item:", err);
      alert(err?.response?.data?.message || "Gagal menghapus produk dari keranjang");
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 flex gap-10">
      {/* LEFT */}
      <div className="flex-1 space-y-6">
        {/* CART LIST */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-5">Your order</h2>

          {loadingCart && <p className="text-gray-400 italic">Loading cart...</p>}

          {!loadingCart && checkoutItems.length === 0 && (
            <p className="text-gray-400 italic">No selected products</p>
          )}

          {checkoutItems.map((item, idx) => {
            const product = item.product || {};
            const image = product.thumbnail || product.image || "/placeholder.png";
            const quantity = getQuantity(item);
            const isBusy = loadingItemId !== null && loadingItemId === item.id;

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
                key={item.id ?? `tmp-${idx}`}
                className="flex justify-between items-center border-b pb-4 mb-4"
              >
                {/* left */}
                <div className="flex gap-3 items-center">
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
                          disabled={isBusy || quantity <= 1}
                          onClick={() => handleUpdateQty(item, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                        >
                          -
                        </button>

                        <span className="min-w-[32px] text-center">{quantity}</span>

                        <button
                          disabled={isBusy}
                          onClick={() => handleUpdateQty(item, quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <button
                        disabled={isBusy}
                        onClick={() => handleDelete(item)}
                        className="text-xs text-red-500 hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* right */}
                <p className="font-semibold text-pink-600 text-right">
                  Rp {toNumber(item.amount ?? item.price ?? product.price ?? 0, 0).toLocaleString("id-ID")}
                </p>
              </div>
            );
          })}
        </div>

        {/* ADDRESS */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Shipping address</h2>
            <button className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg">
              + Add new address
            </button>
          </div>

          {address ? (
            <p className="text-gray-700 leading-relaxed">
              {address.address}, {address.district}, {address.city},{" "}
              {address.province}, {address.postal_code}
            </p>
          ) : (
            <p className="text-gray-400 italic">No address found</p>
          )}
        </div>

        {/* SHIPPING */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

          <div className="space-y-3">
            {shippingMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedShipping(m)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedShipping?.id === m.id
                    ? "border-pink-600 bg-pink-50"
                    : "hover:border-gray-400"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">
                    {m.name} (Rp {m.price.toLocaleString("id-ID")})
                  </p>
                  <p className="text-gray-500 text-sm">{m.estimate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-[360px] bg-white border rounded-2xl shadow-md p-6 h-fit">
        <h2 className="text-xl font-semibold mb-6">Payment</h2>

        <div className="space-y-5">
          {[
            { name: "BCA virtual account", icon: "/icons/bca.png" },
            { name: "BRI virtual account", icon: "/icons/bri.png" },
            { name: "Mandiri virtual account", icon: "/icons/mandiri.png" },
          ].map((method) => (
            <label
              key={method.name}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Image src={method.icon} width={42} height={42} alt={method.name} />
                <span>{method.name}</span>
              </div>

              <input
                type="radio"
                name="payment"
                onChange={() => setSelectedPayment(method.name)}
                className="w-5 h-5 accent-pink-600"
              />
            </label>
          ))}
        </div>

        <hr className="my-6" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>{checkoutItems.length} product(s)</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>

          <div className="flex justify-between">
            <span>Shipment:</span>
            <span>
              {selectedShipping
                ? `Rp ${selectedShipping.price.toLocaleString("id-ID")}`
                : "-"}
            </span>
          </div>

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-pink-600">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <button className="w-full mt-6 py-3 bg-pink-600 text-white rounded-full font-semibold">
          Pay now
        </button>
      </div>
    </div>
  );
}
