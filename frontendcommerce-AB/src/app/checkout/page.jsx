"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Image from "next/image";

const STORAGE_KEY = "checkout_selected_ids";

const unwrap = (res) => res?.data?.data ?? res?.data?.serve ?? res?.data ?? null;
const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [loadingShip, setLoadingShip] = useState(false);

  const [loadingItemId, setLoadingItemId] = useState(null);

  // ===== Add Address Modal State =====
  const [openAdd, setOpenAdd] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [form, setForm] = useState({
    pic_name: "",
    pic_phone: "",
    pic_label: "Home",
    benchmark: "",
    address: "",
    province: "",
    city: "",
    district: "",
    subdistrict: "",
    postal_code: "",
    is_active: 2,
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  // ===== cart selection =====
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
      const payload = unwrap(res);
      const items = payload?.items ?? payload;
      setCart(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error load cart:", err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  const loadAddresses = async (preferSelectId = null) => {
    try {
      setLoadingAddr(true);
      const res = await axios.get("/addresses");
      const payload = unwrap(res);
      const arr = Array.isArray(payload) ? payload : [];
      setAddresses(arr);

      const getIsActive = (a) => n(a?.is_active ?? a?.isActive ?? 0, 0);

      let pick =
        (preferSelectId ? arr.find((x) => x?.id === preferSelectId) : null) ||
        arr.find((x) => getIsActive(x) === 2) ||
        arr[0] ||
        null;

      setSelectedAddressId(pick?.id ?? null);
    } catch (err) {
      console.error("Error load addresses:", err);
      setAddresses([]);
      setSelectedAddressId(null);
    } finally {
      setLoadingAddr(false);
    }
  };

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  const safeCart = Array.isArray(cart) ? cart : [];

  const checkoutItems = useMemo(() => {
    const s = new Set(selectedIds);
    return safeCart.filter((item) => s.has(item?.id));
  }, [safeCart, selectedIds]);

  useEffect(() => {
    if (!loadingCart && selectedIds.length === 0) router.replace("/cart");
  }, [loadingCart, selectedIds.length, router]);

  useEffect(() => {
    if (!loadingCart && selectedIds.length > 0 && checkoutItems.length === 0) {
      router.replace("/cart");
    }
  }, [loadingCart, selectedIds.length, checkoutItems.length, router]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + n(item.amount ?? 0, 0), 0);
  }, [checkoutItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a?.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const weightGrams = useMemo(() => {
    // weight produk kamu ada di item.product.weight (lihat model Product)
    const w = checkoutItems.reduce((sum, item) => {
      const qty = n(item?.qtyCheckout ?? item?.qty ?? item?.quantity ?? 1, 1);
      const pw = n(item?.product?.weight ?? 0, 0);
      return sum + qty * (pw > 0 ? pw : 1);
    }, 0);
    return Math.max(1, w);
  }, [checkoutItems]);

  const total = subtotal + (selectedShipping?.price || 0);

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

  // ===== Select main address (optional: sekalian set main di backend) =====
  const setMainAddress = async (id) => {
    setSelectedAddressId(id);
    try {
      await axios.put("/addresses", { id, is_active: 2 });
      // refresh biar konsisten
      await loadAddresses(id);
    } catch (err) {
      console.error("Failed set main address:", err?.response?.data || err);
      // kalau gagal, tetap biarkan user memilih lokal dulu
    }
  };

  // ===== Shipping methods from RajaOngkir =====
  const fetchShipping = async () => {
    if (!selectedAddress) {
      setShippingMethods([]);
      setSelectedShipping(null);
      return;
    }

    // destination idealnya subdistrict id (yang kamu simpan di user_addresses.sub_district)
    const destination = n(
      selectedAddress?.sub_district ?? selectedAddress?.subDistrict ?? selectedAddress?.district ?? 0,
      0
    );

    if (!destination) {
      setShippingMethods([]);
      setSelectedShipping(null);
      return;
    }

    setLoadingShip(true);
    setSelectedShipping(null);

    try {
      const couriers = ["jne", "jnt", "tiki"]; // kamu bisa tambah "pos", dll kalau Komerce support
      const all = [];

      for (const c of couriers) {
        try {
          const res = await axios.post("/get-cost", {
            destination,
            weight: weightGrams,
            courier: c,
            price: "lowest",
          });
          const payload = unwrap(res);
          const arr = Array.isArray(payload) ? payload : [];
          arr.forEach((x) => all.push(x));
        } catch (e) {
          // ignore courier yang gagal, tetap lanjut
          console.warn("Courier failed:", c, e?.response?.data || e?.message || e);
        }
      }

      const normalized = all
        .map((x) => {
          const costRaw = x?.cost;
          const price =
            typeof costRaw === "number"
              ? costRaw
              : n(costRaw?.value ?? costRaw?.amount ?? 0, 0);

          const name = x?.name || x?.code?.toUpperCase() || "Courier";
          const service = x?.service ? ` - ${x.service}` : "";
          const etd = x?.etd ? String(x.etd) : "";

          return {
            id: `${x?.code || name}-${x?.service || "REG"}-${price}`,
            courier: x?.code || "",
            name: `${name}${service}`,
            price,
            estimate: etd ? `ETD ${etd}` : "-",
            raw: x,
          };
        })
        .filter((m) => m.price > 0);

      setShippingMethods(normalized);
    } finally {
      setLoadingShip(false);
    }
  };

  useEffect(() => {
    // refetch ongkir setiap alamat berubah / item berubah
    fetchShipping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, weightGrams]);

  // ===== Add Address modal: load location lists =====
  const loadProvinces = async () => {
    const res = await axios.get("/province");
    const payload = unwrap(res);
    setProvinces(Array.isArray(payload) ? payload : []);
  };

  const loadCities = async (provinceId) => {
    const res = await axios.get("/city", { params: { province: provinceId } });
    const payload = unwrap(res);
    setCities(Array.isArray(payload) ? payload : []);
  };

  const loadDistricts = async (cityId) => {
    const res = await axios.get("/district", { params: { city: cityId } });
    const payload = unwrap(res);
    setDistricts(Array.isArray(payload) ? payload : []);
  };

  const loadSubDistricts = async (districtId) => {
    const res = await axios.get("/sub-district", { params: { district: districtId } });
    const payload = unwrap(res);
    setSubDistricts(Array.isArray(payload) ? payload : []);
  };

  useEffect(() => {
    if (!openAdd) return;
    loadProvinces();
    // reset dropdown saat buka modal
    setCities([]);
    setDistricts([]);
    setSubDistricts([]);
    setForm((f) => ({
      ...f,
      province: "",
      city: "",
      district: "",
      subdistrict: "",
      postal_code: "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAdd]);

  const submitNewAddress = async () => {
    if (savingAddress) return;

    // validasi minimal
    if (!form.pic_name.trim()) return alert("Nama penerima wajib diisi");
    if (!form.pic_phone.trim()) return alert("No HP wajib diisi");
    if (!form.address.trim()) return alert("Alamat jalan wajib diisi");
    if (!form.province || !form.city || !form.district || !form.subdistrict)
      return alert("Provinsi/Kota/Kecamatan/Kelurahan wajib dipilih");

    setSavingAddress(true);
    try {
      const res = await axios.post("/addresses", {
        address: form.address,
        province: n(form.province),
        city: n(form.city),
        district: n(form.district),
        subdistrict: n(form.subdistrict),
        pic_name: form.pic_name,
        pic_phone: form.pic_phone,
        pic_label: form.pic_label,
        benchmark: form.benchmark,
        is_active: 2, // bikin jadi alamat utama biar langsung kepilih di checkout
      });

      const created = unwrap(res);
      const newId = created?.id;

      setOpenAdd(false);
      await loadAddresses(newId ?? null);
    } catch (err) {
      console.error("Create address failed:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Gagal membuat alamat");
    } finally {
      setSavingAddress(false);
    }
  };

  const showAddressLine = (a) => {
    if (!a) return "-";
    const label = a.pic_label ?? a.picLabel ?? "";
    const addr = a.address ?? "";
    const postal = a.postal_code ?? a.postalCode ?? "";
    // kalau city/province masih angka, minimal tetap tampil address + postal
    const city = a.city ?? "";
    const prov = a.province ?? "";
    return `${label ? label + " — " : ""}${addr}${postal ? ", " + postal : ""} (city:${city}, prov:${prov})`;
  };

  const handlePayNow = async () => {
    if (!selectedAddressId) return alert("Alamat belum dipilih");
    if (!selectedShipping) return alert("Metode pengiriman belum dipilih");
    if (!selectedPayment) return alert("Metode pembayaran belum dipilih");

    alert("OK: next step kita integrasi transaksi + Midtrans");
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
                {/* left */}
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

                {/* right */}
                <p className="font-semibold text-pink-600 text-right">
                  Rp{" "}
                  {n(item.amount ?? item.price ?? product.price ?? 0, 0).toLocaleString("id-ID")}
                </p>
              </div>
            );
          })}
        </div>

        {/* ADDRESS */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Shipping address</h2>
            <button
              onClick={() => setOpenAdd(true)}
              className="px-4 py-2 bg-pink-600 text-white text-sm rounded-lg"
            >
              + Add new address
            </button>
          </div>

          {loadingAddr && <p className="text-gray-400 italic">Loading address...</p>}

          {!loadingAddr && !addresses.length && (
            <p className="text-gray-400 italic">No address found</p>
          )}

          {!!addresses.length && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">Selected:</div>
                <div className="text-gray-600">{showAddressLine(selectedAddress)}</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700">Change address</label>
                <select
                  value={selectedAddressId ?? ""}
                  onChange={(e) => setMainAddress(n(e.target.value))}
                  className="border rounded-lg px-3 py-2"
                >
                  {addresses.map((a) => {
                    const label = a?.pic_label ?? a?.picLabel ?? "Address";
                    const line = a?.address ?? "";
                    return (
                      <option key={a.id} value={a.id}>
                        [{label}] {line}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SHIPPING (FROM RAJAONGKIR) */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>

          {!selectedAddress && (
            <p className="text-gray-400 italic">Pilih alamat dulu untuk lihat ongkir.</p>
          )}

          {selectedAddress && loadingShip && (
            <p className="text-gray-400 italic">Loading shipping options...</p>
          )}

          {selectedAddress && !loadingShip && shippingMethods.length === 0 && (
            <p className="text-gray-400 italic">Ongkir belum tersedia (cek destination/weight).</p>
          )}

          <div className="space-y-3">
            {shippingMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedShipping(m)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedShipping?.id === m.id ? "border-pink-600 bg-pink-50" : "hover:border-gray-400"
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

          <p className="text-xs text-gray-400 mt-3">
            *Ongkir dihitung dari alamat + total berat: {weightGrams} gram
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
            <span>{selectedShipping ? `Rp ${selectedShipping.price.toLocaleString("id-ID")}` : "-"}</span>
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

      {/* ADD ADDRESS MODAL */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add new address</h3>
              <button onClick={() => setOpenAdd(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Full name"
                value={form.pic_name}
                onChange={(e) => setForm((f) => ({ ...f, pic_name: e.target.value }))}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Phone number"
                value={form.pic_phone}
                onChange={(e) => setForm((f) => ({ ...f, pic_phone: e.target.value }))}
              />
            </div>

            <textarea
              className="border rounded-lg px-3 py-2 w-full mt-3"
              rows={3}
              placeholder="Street name"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Label (Home/Office)"
                value={form.pic_label}
                onChange={(e) => setForm((f) => ({ ...f, pic_label: e.target.value }))}
              />
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Benchmark (optional)"
                value={form.benchmark}
                onChange={(e) => setForm((f) => ({ ...f, benchmark: e.target.value }))}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <select
                className="border rounded-lg px-3 py-2"
                value={form.province}
                onChange={async (e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    province: v,
                    city: "",
                    district: "",
                    subdistrict: "",
                    postal_code: "",
                  }));
                  setCities([]);
                  setDistricts([]);
                  setSubDistricts([]);
                  if (v) await loadCities(v);
                }}
              >
                <option value="">Province</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2"
                value={form.city}
                onChange={async (e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    city: v,
                    district: "",
                    subdistrict: "",
                    postal_code: "",
                  }));
                  setDistricts([]);
                  setSubDistricts([]);
                  if (v) await loadDistricts(v);
                }}
                disabled={!form.province}
              >
                <option value="">City</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2"
                value={form.district}
                onChange={async (e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    district: v,
                    subdistrict: "",
                    postal_code: "",
                  }));
                  setSubDistricts([]);
                  if (v) await loadSubDistricts(v);
                }}
                disabled={!form.city}
              >
                <option value="">District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2"
                value={form.subdistrict}
                onChange={(e) => {
                  const v = e.target.value;
                  const sd = subDistricts.find((x) => String(x.id) === String(v));
                  setForm((f) => ({
                    ...f,
                    subdistrict: v,
                    postal_code: sd?.zip_code ?? "",
                  }));
                }}
                disabled={!form.district}
              >
                <option value="">Sub district</option>
                {subDistricts.map((sd) => (
                  <option key={sd.id} value={sd.id}>
                    {sd.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <input
                className="border rounded-lg px-3 py-2 w-full bg-gray-50"
                placeholder="Postal code (auto)"
                value={form.postal_code}
                disabled
              />
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setOpenAdd(false)}
                className="px-4 py-2 rounded-lg border"
                disabled={savingAddress}
              >
                Cancel
              </button>
              <button
                onClick={submitNewAddress}
                className="px-4 py-2 rounded-lg bg-pink-600 text-white"
                disabled={savingAddress}
              >
                {savingAddress ? "Saving..." : "Save address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
