"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { AddressCard } from "@/app/account";
import { NewAddress } from "@/app/account/popup";
import { PAYMENT_METHODS } from "@/data/paymentMethods";
import { n, isNumericLike } from "@/utils/number";
import { calcWeightRounded } from "@/utils/checkoutWeight";
import { useCheckoutCartServer } from "@/app/hooks/useCheckoutCartServer";
import { useCartMutations } from "@/app/hooks/useCartMutations";
import { useAddresses } from "@/app/hooks/useAddresses";
import { useLocationNames } from "@/app/hooks/useLocationNames";
import { useShippingOptions } from "@/app/hooks/useShippingOptions";

export default function CheckoutPage() {
  const router = useRouter();
  const { checkoutItems, subtotal, loadingCart, reloadCart } =
    useCheckoutCartServer();
  const { loadingItemId, handleUpdateQty, handleDelete } = useCartMutations({
    reloadCart,
  });

  const {
    addresses,
    selectedAddressId,
    selectedAddress,
    loadingAddr,
    reloadAddresses,
    selectAsMain,
  } = useAddresses();

  const { provinceMap, cityMap } = useLocationNames(addresses);
  const weightRounded = useMemo(
    () => calcWeightRounded(checkoutItems),
    [checkoutItems]
  );
  const {
    shippingAll,
    selectedShipping, // <- anggap "recommended" oleh sistem
    setSelectedShipping,
    expandedCouriers,
    setExpandedCouriers,
    loadingShip,
    shippingError,
    shippingGroups,
    bestByCourier,
    courierKeys,
  } = useShippingOptions({
    selectedAddress,
    selectedAddressId,
    weightRounded,
    enabled: !loadingCart && !loadingAddr && checkoutItems.length > 0,
  });
  const [confirmedShipping, setConfirmedShipping] = useState(null);
  useEffect(() => {
    setConfirmedShipping(null);
  }, [selectedAddressId, weightRounded, checkoutItems.length]);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const total = subtotal + n(confirmedShipping?.price, 0);
  const displayAddresses = useMemo(() => {
    return (Array.isArray(addresses) ? addresses : []).map((a) => {
      const cityVal = a?.city;
      const provVal = a?.province;

      const cityName =
        a?.cityName ||
        a?.city_name ||
        (typeof cityVal === "string" && !isNumericLike(cityVal)
          ? cityVal
          : cityMap[String(cityVal)] ||
            (isNumericLike(cityVal) ? String(cityVal) : ""));

      const provinceName =
        a?.provinceName ||
        a?.province_name ||
        provinceMap[String(provVal)] ||
        (isNumericLike(provVal) ? String(provVal) : "");

      return { ...a, _cityName: cityName, _provinceName: provinceName };
    });
  }, [addresses, cityMap, provinceMap]);

  const handlePayNow = async () => {
    if (!selectedAddressId) return alert("Alamat belum dipilih");
    if (!confirmedShipping) return alert("Pilih metode pengiriman dulu");
    if (!selectedPayment) return alert("Metode pembayaran belum dipilih");
    if (!checkoutItems.length) return alert("Item checkout kosong");

    try {
      setLoadingPay(true);

      const cartIds = checkoutItems.map((x) => x?.id).filter(Boolean);
      const payload = {
        cart_ids: cartIds,
        user_address_id: selectedAddressId,
        shipping_service_type: confirmedShipping.courier,
        shipping_service: confirmedShipping.service,
        shipping_price: confirmedShipping.price,
        shipping_etd: confirmedShipping.estimate ?? null,
        weight: weightRounded,
        is_protected: false,
        protection_fee: 0,
      };

      const res = await axios.post("/transaction", payload);
      const serve = res?.data?.serve;
      const token = serve?.ecommerce?.tokenMidtrans;
      const redirectUrl = serve?.ecommerce?.redirectUrl;
      const orderId =
        serve?.transactionNumber ||
        serve?.transaction_number ||
        serve?.transaction?.transactionNumber ||
        null;

      const goOrderHistory = () => {
        const q = orderId ? `?order_id=${encodeURIComponent(orderId)}` : "";
        router.push(`/account/order-history${q}`);
      };

      if (!token && !redirectUrl) {
        console.warn("Transaction response:", res?.data);
        alert("Gagal memulai pembayaran: token/redirect_url tidak ditemukan.");
        return;
      }

      if (token && typeof window !== "undefined" && window.snap?.pay) {
        window.snap.pay(token, {
          onSuccess: goOrderHistory,
          onPending: goOrderHistory,
          onError: () => alert("Pembayaran gagal ❌"),
          onClose: () => {},
        });
        return;
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      alert(`Transaksi dibuat (${orderId || "-"}) tapi Snap belum ready.`);
    } catch (err) {
      console.error("create transaction error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Gagal membuat transaksi");
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <>
      {/* Midtrans Snap.js (SANDBOX) */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-10">
        {/* LEFT */}
        <div className="flex-1 space-y-6">
          {/* CART LIST */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-5">Your order</h2>

            {loadingCart && (
              <p className="text-gray-400 italic">Loading cart...</p>
            )}

            {!loadingCart && checkoutItems.length === 0 && (
              <p className="text-gray-400 italic">No selected products</p>
            )}

            {checkoutItems.map((item, idx) => {
              const product = item.product || {};

              const image = product.thumbnail || product.image || "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";
              const quantity = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);
              const isBusy = loadingItemId !== null && loadingItemId === item.id;

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
                  key={item.id ?? `tmp-${idx}`}
                  className="flex justify-between items-center border-b pb-4 mb-4"
                >
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
                      <p className="text-sm text-gray-500">
                        Variant: {variantName}
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isBusy || quantity <= 1 || loadingPay}
                            onClick={() => handleUpdateQty(item, quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                          >
                            -
                          </button>

                          <span className="min-w-8 text-center">
                            {quantity}
                          </span>

                          <button
                            disabled={isBusy || loadingPay}
                            onClick={() => handleUpdateQty(item, quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center border rounded-full text-sm disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <button
                          disabled={isBusy || loadingPay}
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
                    {n(
                      item.amount ?? item.price ?? product.price ?? 0,
                      0
                    ).toLocaleString("id-ID")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ADDRESS */}
          <div className="p-4 font-medium text-base bg-muted border border-neutral-100 w-full rounded-2xl space-y-6">
            <div className="flex w-full items-center justify-between">
              <h3 className="font-bold">Shipping address</h3>
              <NewAddress onSuccess={() => reloadAddresses()} />
            </div>

            {loadingAddr && (
              <p className="text-gray-400 italic">Loading address...</p>
            )}

            {!loadingAddr && !displayAddresses.length && (
              <p className="text-gray-400 italic">No address found</p>
            )}

            {!!displayAddresses.length && (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                {displayAddresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    id={a.id}
                    benchmark={a.benchmark || ""}
                    label={a.picLabel || a.pic_label || ""}
                    line={a.address || ""}
                    city={a._cityName || ""}
                    province={a._provinceName || ""}
                    postalCode={a.postalCode || a.postal_code || ""}
                    name={a.picName || a.pic_name || "receiver"}
                    phone={
                      a.phone ||
                      a.picPhone ||
                      a.pic_phone ||
                      (a.pic && a.pic.phone) ||
                      ""
                    }
                    selected={a.id === selectedAddressId}
                    disabled={loadingAddr || loadingPay}
                    onSelect={selectAsMain}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SHIPPING */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

            {!selectedAddress && (
              <p className="text-gray-400 italic">
                Pilih alamat dulu untuk lihat ongkir.
              </p>
            )}

            {selectedAddress && loadingShip && (
              <p className="text-gray-400 italic">
                Loading shipping options...
              </p>
            )}

            {selectedAddress && !!shippingError && (
              <div className="border border-red-300 bg-red-50 text-red-600 rounded-lg p-3 mb-3 text-sm">
                <div className="font-semibold">Shipping error</div>
                <div>{shippingError}</div>
              </div>
            )}

            {selectedAddress &&
              !loadingShip &&
              courierKeys.length === 0 &&
              !shippingError && (
                <p className="text-gray-400 italic">
                  Tidak ada opsi pengiriman. (cek district di alamat +
                  KOMERCE_ORIGIN di backend)
                </p>
              )}

            {/* ✅ reminder: harus pilih shipping */}
            {selectedAddress &&
              !loadingShip &&
              courierKeys.length > 0 &&
              !confirmedShipping && (
                <div className="mb-3 text-sm text-gray-600">
                  Pilih salah satu service pengiriman.
                  {selectedShipping ? (
                    <span className="ml-1 text-gray-500">
                      <b>{selectedShipping.courier?.toUpperCase()}</b>{" "}
                      {selectedShipping.service}
                      {n(selectedShipping.price, 0).toLocaleString("id-ID")}
                    </span>
                  ) : null}
                </div>
              )}

            <div className="space-y-3">
              {courierKeys.map((courier) => {
                const expanded = !!expandedCouriers[courier];
                const list = shippingGroups[courier] || [];
                const best = bestByCourier[courier];

                return (
                  <div
                    key={courier}
                    onClick={() =>
                      setExpandedCouriers((prev) => ({
                        ...prev,
                        [courier]: !prev[courier],
                      }))
                    }
                    className={`rounded-xl border p-4 cursor-pointer transition ${
                      expanded
                        ? "border-pink-600 bg-pink-50"
                        : "hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold uppercase">{courier}</p>
                        {best ? (
                          <p className="text-sm text-gray-600 mt-1">
                            Best:{" "}
                            <span className="font-medium">{best.service}</span>{" "}
                            • Rp {n(best.price, 0).toLocaleString("id-ID")} •{" "}
                            {best.estimate}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            Tidak ada service.
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {expanded ? "Tutup" : `Lihat service (${list.length})`}
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 space-y-2">
                        {list.map((opt) => {
                          const isSelected = confirmedShipping?.id === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmedShipping(opt);
                                setSelectedShipping(opt);
                              }}
                              className={`p-3 rounded-xl border transition ${
                                isSelected
                                  ? "border-pink-600 bg-white"
                                  : "bg-white hover:border-gray-400"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="font-medium">
                                    {opt.service} (Rp{" "}
                                    {n(opt.price, 0).toLocaleString("id-ID")})
                                  </p>
                                  {!!opt.description && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {opt.description}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                  {opt.estimate}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              *Berat: {weightRounded} gram (rounded) | {shippingAll.length}{" "}
              service (setelah filter cargo)
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-90 bg-white border rounded-2xl shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">Payment</h2>

          <div className="space-y-5">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={method.icon}
                    width={42}
                    height={42}
                    alt={method.name}
                  />
                  <span>{method.name}</span>
                </div>

                <input
                  type="radio"
                  name="payment"
                  checked={selectedPayment === method.id}
                  onChange={() => setSelectedPayment(method.id)}
                  className="w-5 h-5 accent-pink-600"
                  disabled={loadingPay}
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
                {confirmedShipping
                  ? `Rp ${n(confirmedShipping.price, 0).toLocaleString(
                      "id-ID"
                    )}`
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

          <button
            onClick={handlePayNow}
            disabled={
              loadingPay ||
              loadingCart ||
              loadingAddr ||
              loadingShip ||
              !selectedAddressId ||
              !confirmedShipping ||
              !selectedPayment ||
              checkoutItems.length === 0
            }
            className="w-full mt-6 py-3 bg-pink-600 text-white rounded-full font-semibold disabled:opacity-50"
          >
            {loadingPay ? "Processing..." : "Pay now"}
          </button>
        </div>
      </div>
    </>
  );
}
