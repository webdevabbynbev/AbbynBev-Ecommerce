"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Image from "next/image";

import { AddressCard } from "@/app/account";
import { NewAddress } from "@/app/account/popup";

const STORAGE_KEY = "checkout_selected_ids";

// ✅ support backend response {data}, {serve}, array, atau {results}
const unwrap = (res) => {
  const d = res?.data;
  return d?.data ?? d?.serve ?? d ?? null;
};

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const isNumericLike = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" && !Number.isNaN(Number(v));

// ===== safe sessionStorage (Safari / private mode bisa throw) =====
const ssGet = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const ssSet = (key, value) => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedIdsReady, setSelectedIdsReady] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [provinceMap, setProvinceMap] = useState({});
  const [cityMap, setCityMap] = useState({});

  // Shipping
  const [shippingAll, setShippingAll] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [expandedCouriers, setExpandedCouriers] = useState({}); // courier -> boolean

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [loadingShip, setLoadingShip] = useState(false);

  const [loadingItemId, setLoadingItemId] = useState(null);

  // ===== cart selection =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setSelectedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSelectedIds([]);
    } finally {
      setSelectedIdsReady(true);
    }
  }, []);

  const loadCart = async () => {
    try {
      setLoadingCart(true);
      const res = await axios.get("/cart");
      const payload = unwrap(res);
      const items = payload?.items ?? payload;
      setCart(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn("Error load cart:", err?.response?.data || err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  const hydrateLocationNames = async (data) => {
    try {
      const provinceIds = Array.from(
        new Set(
          (Array.isArray(data) ? data : [])
            .map((a) => a?.province)
            .filter((p) => isNumericLike(p))
            .map((p) => Number(p))
        )
      );

      const provRes = await axios.get("/province");
      const provList = provRes?.data?.serve || provRes?.data?.data || [];
      const provMapNext = {};
      (Array.isArray(provList) ? provList : []).forEach((p) => {
        provMapNext[String(p.id)] = p.name;
      });
      setProvinceMap(provMapNext);

      const cityMapNext = {};
      await Promise.all(
        provinceIds.map(async (pid) => {
          const res = await axios.get("/city", { params: { province: pid } });
          const list = res?.data?.serve || res?.data?.data || [];
          (Array.isArray(list) ? list : []).forEach((c) => {
            cityMapNext[String(c.id)] = c.name;
          });
        })
      );
      setCityMap(cityMapNext);
    } catch (e) {
      console.warn("Hydrate location names failed:", e?.response?.data || e);
    }
  };

  const loadAddresses = async (preferSelectId = null) => {
    try {
      setLoadingAddr(true);
      const res = await axios.get("/addresses");
      const payload = unwrap(res);

      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.serve)
        ? payload.serve
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      setAddresses(arr);

      const getIsActive = (a) => n(a?.is_active ?? a?.isActive ?? 0, 0);

      const pick =
        (preferSelectId ? arr.find((x) => x?.id === preferSelectId) : null) ||
        arr.find((x) => getIsActive(x) === 2) ||
        arr[0] ||
        null;

      setSelectedAddressId(pick?.id ?? null);
      hydrateLocationNames(arr);
    } catch (err) {
      console.warn("Error load addresses:", err?.response?.data || err);
      setAddresses([]);
      setSelectedAddressId(null);
    } finally {
      setLoadingAddr(false);
    }
  };

  useEffect(() => {
    loadCart();
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeCart = Array.isArray(cart) ? cart : [];

  const checkoutItems = useMemo(() => {
    const s = new Set(selectedIds);
    return safeCart.filter((item) => s.has(item?.id));
  }, [safeCart, selectedIds]);

  // ✅ cegah redirect sebelum selectedIds kebaca
  useEffect(() => {
    if (!selectedIdsReady) return;
    if (!loadingCart && selectedIds.length === 0) router.replace("/cart");
  }, [loadingCart, selectedIds.length, router, selectedIdsReady]);

  useEffect(() => {
    if (!selectedIdsReady) return;
    if (!loadingCart && selectedIds.length > 0 && checkoutItems.length === 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedIds.length, checkoutItems.length, router, selectedIdsReady]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + n(item.amount ?? 0, 0), 0);
  }, [checkoutItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a?.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  // ✅ total berat gram (fallback 200g/item) + prefer variant weight kalau ada
  const weightGrams = useMemo(() => {
    const w = checkoutItems.reduce((sum, item) => {
      const qty = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);

      const vw = n(item?.variant?.weight ?? 0, 0);
      const pw = n(item?.product?.weight ?? 0, 0);
      const rawW = vw > 0 ? vw : pw;

      const grams =
        rawW <= 0 ? 200 : rawW > 0 && rawW < 1 ? Math.round(rawW * 1000) : Math.round(rawW);

      return sum + qty * grams;
    }, 0);

    return Math.max(1, Math.round(w));
  }, [checkoutItems]);

  // ✅ round per 100g (hemat hit)
  const weightRounded = useMemo(() => Math.max(1, Math.ceil(weightGrams / 100) * 100), [weightGrams]);

  const total = subtotal + n(selectedShipping?.price, 0);

  // ===== Update qty/delete cart =====
  const handleUpdateQty = async (item, nextQty) => {
    if (!item?.id) return alert("Cart item id tidak ditemukan");
    const newQty = n(nextQty, 0);
    if (newQty <= 0) return;

    try {
      setLoadingItemId(item.id);
      await axios.put(`/cart/${item.id}`, { qty: newQty });
      await loadCart();
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
      await axios.delete(`/cart/${item.id}`);

      setSelectedIds((prev) => {
        const next = prev.filter((id) => id !== item.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      await loadCart();
    } catch (err) {
      console.warn("Error delete cart item:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Gagal menghapus produk dari keranjang");
    } finally {
      setLoadingItemId(null);
    }
  };

  // ===== Select main address =====
  const setMainAddress = async (id) => {
    setSelectedAddressId(id);
    try {
      await axios.put("/addresses", { id, is_active: 2 });
      await loadAddresses(id);
    } catch (err) {
      console.warn("Failed set main address:", err?.response?.data || err);
    }
  };

  // ✅ normalizer response dari /get-cost (Komerce/RajaOngkir)
  const normalizeShipping = (payload) => {
    const arr = Array.isArray(payload) ? payload : payload?.data || payload?.results || [];
    const list = Array.isArray(arr) ? arr : [];

    const seen = new Set();
    const out = [];

    for (const x of list) {
      const code = String(
        x?.code ??
          x?.courier ??
          x?.courier_code ??
          x?.courierCode ??
          x?.courier_name ??
          x?.courierName ??
          x?.name ??
          ""
      )
        .trim()
        .toUpperCase();

      const service = String(
        x?.service ??
          x?.service_code ??
          x?.serviceCode ??
          x?.service_name ??
          x?.serviceName ??
          "REG"
      )
        .trim()
        .toUpperCase();

      const cost = n(x?.cost ?? x?.price ?? x?.value ?? x?.amount ?? 0, 0);
      const etd = String(x?.etd ?? x?.estimate ?? "").trim();
      const desc = String(x?.description ?? x?.desc ?? "").trim();

      if (!code || cost <= 0) continue;

      // ✅ filter layanan cargo/jutaan/tier
      const bad =
        /JTR|TRUCK|CARGO|KARGO/i.test(service) ||
        /[<>]/.test(service) ||
        /[<>]/.test(desc) ||
        /JTR|TRUCK|CARGO|KARGO/i.test(desc);

      if (bad) continue;

      const id = `${code}-${service}-${cost}`;
      if (seen.has(id)) continue;
      seen.add(id);

      out.push({
        id,
        courier: code.toLowerCase(),
        service,
        name: `${code} - ${service}`,
        description: desc,
        price: cost,
        estimate: etd ? `${etd}` : "-",
        raw: x,
      });
    }

    out.sort((a, b) => a.price - b.price);
    return out;
  };

  // ✅ group by courier + best option per courier
  const groupByCourier = (list) => {
    const groups = {};
    for (const m of list) {
      const k = m.courier || "unknown";
      if (!groups[k]) groups[k] = [];
      groups[k].push(m);
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => a.price - b.price);
    }

    const prefer = ["REG", "ECO", "YES", "OKE", "EZ", "CTC", "EXP"];
    const best = {};
    for (const [courier, items] of Object.entries(groups)) {
      let pick = null;
      for (const p of prefer) {
        pick = items.find((x) => String(x.service).toUpperCase() === p);
        if (pick) break;
      }
      best[courier] = pick || items[0] || null;
    }
    return { groups, best };
  };

  const pickCheapestBest = (bestMap) => {
    const bestList = Object.values(bestMap || {}).filter(Boolean);
    bestList.sort((a, b) => a.price - b.price);
    return bestList[0] || null;
  };

  // ===== Shipping fetch (hemat hit) =====
  const lastShipKeyRef = useRef("");
  const shipTimerRef = useRef(null);
  const shipReqIdRef = useRef(0);

  const fetchShipping = async () => {
    if (!selectedIdsReady) return;
    if (!selectedAddress || loadingCart || loadingAddr) return;
    if (!checkoutItems.length) return;

    const destinationSubdistrict = n(
      selectedAddress?.subDistrict ??
        selectedAddress?.subdistrict ??
        selectedAddress?.sub_district ??
        selectedAddress?.subdistrictId ??
        selectedAddress?.subdistrict_id ??
        0,
      0
    );

    if (!destinationSubdistrict) {
      setShippingAll([]);
      setSelectedShipping(null);
      return;
    }

    const key = `ship:${selectedAddressId}|${destinationSubdistrict}|${weightRounded}`;

    // ✅ session cache
    const cached = ssGet(key);
    if (cached) {
      try {
        const payload = JSON.parse(cached);
        const normalized = normalizeShipping(payload);
        setShippingAll(normalized);

        const { best } = groupByCourier(normalized);
        const cheapestBest = pickCheapestBest(best);

        setSelectedShipping((prev) => {
          if (!normalized.length) return null;
          if (!prev) return cheapestBest || normalized[0];
          return normalized.find((x) => x.id === prev.id) || cheapestBest || normalized[0];
        });
        return;
      } catch {
        // kalau cache rusak, lanjut request
      }
    }

    // ✅ anti double hit (StrictMode)
    if (lastShipKeyRef.current === key) return;
    lastShipKeyRef.current = key;

    const reqId = ++shipReqIdRef.current;

    setLoadingShip(true);
    try {
      const res = await axios.post("/get-cost", {
        destination: destinationSubdistrict,
        destinationType: "subdistrict",
        weight: weightRounded,
        courier: "all", // ✅ FE tidak hardcode list kurir (backend yang expand)
        price: "all",
      });

      if (reqId !== shipReqIdRef.current) return;

      const payload = unwrap(res);
      ssSet(key, JSON.stringify(payload));

      const normalized = normalizeShipping(payload);
      setShippingAll(normalized);

      const { best } = groupByCourier(normalized);
      const cheapestBest = pickCheapestBest(best);

      setSelectedShipping((prev) => {
        if (!normalized.length) return null;
        if (!prev) return cheapestBest || normalized[0];
        return normalized.find((x) => x.id === prev.id) || cheapestBest || normalized[0];
      });
    } catch (err) {
      // pakai warn biar overlay Next nggak rese
      console.warn("fetchShipping error detail:", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
        url: `${err?.config?.baseURL || ""}${err?.config?.url || ""}`,
      });

      setShippingAll([]);
      setSelectedShipping(null);

      // ✅ biar bisa retry
      lastShipKeyRef.current = "";
    } finally {
      setLoadingShip(false);
    }
  };

  // ✅ debounce
  useEffect(() => {
    if (shipTimerRef.current) clearTimeout(shipTimerRef.current);
    shipTimerRef.current = setTimeout(() => {
      fetchShipping();
    }, 700);

    return () => {
      if (shipTimerRef.current) clearTimeout(shipTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, weightRounded, selectedIdsReady, loadingCart, loadingAddr, checkoutItems.length]);

  const { groups: shippingGroups, best: bestByCourier } = useMemo(() => {
    return groupByCourier(shippingAll);
  }, [shippingAll]);

  const courierKeys = useMemo(() => {
    const keys = Object.keys(shippingGroups || {});
    keys.sort();
    return keys;
  }, [shippingGroups]);

  // ---- address display list (pakai nama city/province)
  const displayAddresses = useMemo(() => {
    return (Array.isArray(addresses) ? addresses : []).map((a) => {
      const cityVal = a?.city;
      const provVal = a?.province;

      const cityName =
        a?.cityName ||
        a?.city_name ||
        (typeof cityVal === "string" && !isNumericLike(cityVal)
          ? cityVal
          : cityMap[String(cityVal)] || (isNumericLike(cityVal) ? String(cityVal) : ""));

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
    if (!selectedShipping) return alert("Metode pengiriman belum dipilih");
    if (!selectedPayment) return alert("Metode pembayaran belum dipilih");

    alert("OK: next step integrasi transaksi + Midtrans");
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
            const quantity = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);
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
                <div className="flex gap-3 items-center">
                  <Image src={image} width={60} height={60} alt={productName} className="rounded-md" />
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

                <p className="font-semibold text-pink-600 text-right">
                  Rp {n(item.amount ?? item.price ?? product.price ?? 0, 0).toLocaleString("id-ID")}
                </p>
              </div>
            );
          })}
        </div>

        {/* ADDRESS */}
        <div className="p-4 font-medium text-base bg-muted border-1 border-neutral-100 w-full rounded-2xl space-y-6">
          <div className="flex w-full items-center justify-between">
            <h3 className="font-bold">Shipping address</h3>
            <NewAddress onSuccess={() => loadAddresses()} />
          </div>

          {loadingAddr && <p className="text-gray-400 italic">Loading address...</p>}

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
                  phone={a.phone || a.picPhone || a.pic_phone || (a.pic && a.pic.phone) || ""}
                  selected={a.id === selectedAddressId}
                  disabled={loadingAddr}
                  onSelect={setMainAddress}
                />
              ))}
            </div>
          )}
        </div>

        {/* SHIPPING: COURIER CARDS */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

          {!selectedAddress && (
            <p className="text-gray-400 italic">Pilih alamat dulu untuk lihat ongkir.</p>
          )}

          {selectedAddress && loadingShip && (
            <p className="text-gray-400 italic">Loading shipping options...</p>
          )}

          {selectedAddress && !loadingShip && courierKeys.length === 0 && (
            <p className="text-gray-400 italic">
              Tidak ada opsi pengiriman. (cek subDistrict di alamat + originType/origin di backend)
            </p>
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
                    expanded ? "border-pink-600 bg-pink-50" : "hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold uppercase">{courier}</p>
                      {best ? (
                        <p className="text-sm text-gray-600 mt-1">
                          Best: <span className="font-medium">{best.service}</span> • Rp{" "}
                          {n(best.price, 0).toLocaleString("id-ID")} • {best.estimate}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">Tidak ada service.</p>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {expanded ? "Tutup" : `Lihat service (${list.length})`}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 space-y-2">
                      {list.map((opt) => {
                        const isSelected = selectedShipping?.id === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShipping(opt);
                            }}
                            className={`p-3 rounded-xl border transition ${
                              isSelected ? "border-pink-600 bg-white" : "bg-white hover:border-gray-400"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <p className="font-medium">
                                  {opt.service} (Rp {n(opt.price, 0).toLocaleString("id-ID")})
                                </p>
                                {!!opt.description && (
                                  <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 whitespace-nowrap">{opt.estimate}</p>
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
            *Berat: {weightRounded} gram (rounded) | {shippingAll.length} service (setelah filter cargo)
          </p>
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
            <label key={method.name} className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Image src={method.icon} width={42} height={42} alt={method.name} />
                <span>{method.name}</span>
              </div>

              <input
                type="radio"
                name="payment"
                checked={selectedPayment === method.name}
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
              {selectedShipping ? `Rp ${n(selectedShipping.price, 0).toLocaleString("id-ID")}` : "-"}
            </span>
          </div>

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-pink-600">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          onClick={handlePayNow}
          className="w-full mt-6 py-3 bg-pink-600 text-white rounded-full font-semibold"
        >
          Pay now
        </button>
      </div>
    </div>
  );
}
