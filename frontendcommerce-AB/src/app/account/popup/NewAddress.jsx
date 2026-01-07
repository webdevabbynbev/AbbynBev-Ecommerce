"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "@/lib/axios";
import { Textarea } from "@/components";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TxtField,
} from "@/components";

export function NewAddress({ onSuccess }) {
  const [open, setOpen] = useState(false);

  // form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [saving, setSaving] = useState(false);

  // ===== Kota/Kab =====
  const [cityQuery, setCityQuery] = useState("Cimahi");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityId, setCityId] = useState("");
  const selectedCity = useMemo(
    () => cities.find((c) => String(c.id) === String(cityId)) || null,
    [cities, cityId]
  );

  // ===== Kecamatan =====
  const [districtQuery, setDistrictQuery] = useState("");
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [districtId, setDistrictId] = useState("");
  const selectedDistrict = useMemo(
    () => districts.find((d) => String(d.id) === String(districtId)) || null,
    [districts, districtId]
  );

  // ===== Kelurahan =====
  const [subQuery, setSubQuery] = useState("");
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subId, setSubId] = useState("");
  const selectedSub = useMemo(
    () => subs.find((s) => String(s.id) === String(subId)) || null,
    [subs, subId]
  );

  // ===== Kode Pos =====
  const [postalCodes, setPostalCodes] = useState([]);
  const [postalCode, setPostalCode] = useState("");

  const cityTimer = useRef(null);
  const districtTimer = useRef(null);
  const subTimer = useRef(null);

  const resetAll = () => {
    setFullName("");
    setPhone("");
    setStreet("");
    setSaving(false);

    setCityQuery("Cimahi");
    setCities([]);
    setCityId("");

    setDistrictQuery("");
    setDistricts([]);
    setDistrictId("");

    setSubQuery("");
    setSubs([]);
    setSubId("");

    setPostalCodes([]);
    setPostalCode("");
  };

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ===== fetch cities debounce =====
  useEffect(() => {
    if (!open) return;

    const q = String(cityQuery || "").trim();
    if (cityTimer.current) clearTimeout(cityTimer.current);

    if (!q || q.length < 2) {
      setCities([]);
      setCityId("");
      return;
    }

    cityTimer.current = setTimeout(async () => {
      setLoadingCities(true);
      try {
        const res = await axios.get("/regions/cities", { params: { q, limit: 20 } });
        const arr = Array.isArray(res.data?.serve) ? res.data.serve : [];
        setCities(arr);

        // kalau cityId lama gak ada, reset
        setCityId((prev) => {
          if (!prev) return "";
          const exists = arr.some((x) => String(x.id) === String(prev));
          return exists ? prev : "";
        });
      } catch (e) {
        console.error(e);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    }, 300);

    return () => cityTimer.current && clearTimeout(cityTimer.current);
  }, [cityQuery, open]);

  // reset chain saat city berubah
  useEffect(() => {
    setDistricts([]);
    setDistrictId("");
    setDistrictQuery("");

    setSubs([]);
    setSubId("");
    setSubQuery("");

    setPostalCodes([]);
    setPostalCode("");
  }, [cityId]);

  // ===== fetch districts =====
  useEffect(() => {
    if (!open) return;
    if (!cityId) return;

    const q = String(districtQuery || "").trim();
    if (districtTimer.current) clearTimeout(districtTimer.current);

    districtTimer.current = setTimeout(async () => {
      setLoadingDistricts(true);
      try {
        const res = await axios.get("/regions/districts", {
          params: { city_id: cityId, q, limit: 100 },
        });
        const arr = Array.isArray(res.data?.serve) ? res.data.serve : [];
        setDistricts(arr);

        setDistrictId((prev) => {
          if (!prev) return "";
          const exists = arr.some((x) => String(x.id) === String(prev));
          return exists ? prev : "";
        });
      } catch (e) {
        console.error(e);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    }, 250);

    return () => districtTimer.current && clearTimeout(districtTimer.current);
  }, [cityId, districtQuery, open]);

  // reset chain saat district berubah
  useEffect(() => {
    setSubs([]);
    setSubId("");
    setSubQuery("");

    setPostalCodes([]);
    setPostalCode("");
  }, [districtId]);

  // ===== fetch sub districts (kelurahan) =====
  useEffect(() => {
    if (!open) return;
    if (!districtId) return;

    const q = String(subQuery || "").trim();
    if (subTimer.current) clearTimeout(subTimer.current);

    subTimer.current = setTimeout(async () => {
      setLoadingSubs(true);
      try {
        const res = await axios.get("/regions/sub-districts", {
          params: { district_id: districtId, q, limit: 200 },
        });
        const arr = Array.isArray(res.data?.serve) ? res.data.serve : [];
        setSubs(arr);

        setSubId((prev) => {
          if (!prev) return "";
          const exists = arr.some((x) => String(x.id) === String(prev));
          return exists ? prev : "";
        });
      } catch (e) {
        console.error(e);
        setSubs([]);
      } finally {
        setLoadingSubs(false);
      }
    }, 250);

    return () => subTimer.current && clearTimeout(subTimer.current);
  }, [districtId, subQuery, open]);

  // ===== fetch postal codes =====
  useEffect(() => {
    if (!open) return;
    if (!subId) return;

    (async () => {
      try {
        const res = await axios.get("/regions/postal-codes", { params: { sub_district_id: subId } });
        const arr = Array.isArray(res.data?.serve) ? res.data.serve : [];
        setPostalCodes(arr);

        // kalau cuma 1, auto pilih; kalau >1 user pilih (walau di DB kamu umumnya 1)
        if (arr.length === 1) setPostalCode(String(arr[0]));
        else setPostalCode("");
      } catch (e) {
        console.error(e);
        setPostalCodes([]);
        setPostalCode("");
      }
    })();
  }, [subId, open]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving) return;

    if (!fullName.trim()) return alert("Full name wajib diisi");
    if (!phone.trim()) return alert("Phone number wajib diisi");
    if (!street.trim()) return alert("Street wajib diisi");

    if (!cityId) return alert("Pilih Kota/Kab dulu");
    if (!districtId) return alert("Pilih Kecamatan dulu");
    if (!subId) return alert("Pilih Kelurahan dulu");
    if (!postalCode) return alert("Pilih Kode Pos dulu");

    try {
      setSaving(true);

      const cityName = selectedCity?.name || "";
      const districtName = selectedDistrict?.name || "";
      const subName = selectedSub?.name || "";

      const fullAddress = `${street}
Kel. ${subName}
Kec. ${districtName}
${cityName} ${postalCode}`.trim();

      await axios.post("/addresses", {
        address: fullAddress,

        pic_name: fullName,
        pic_phone: phone,
        pic_label: "Home",
        benchmark: "",
        is_active: 2,

        // simpan dropdown wilayah (biar tidak bisa mismatch)
        city: Number(cityId),
        district: Number(districtId),
        sub_district: Number(subId),

        // untuk ongkir biteship (tanpa area_id pun bisa)
        postal_code: postalCode,
      });

      onSuccess?.();
      setOpen(false);
      resetAll();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal menyimpan alamat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
        <DialogTrigger asChild>
          <Button variant="primary" size="sm" iconName="Plus">
            Add new address
          </Button>
        </DialogTrigger>

        <DialogContent className="flex flex-col sm:max-w-[300px] md:max-w-[425px] h-[80%] overflow-y-auto overflow-x-hidden custom-scrollbar justify-start items-start">
          <DialogHeader>
            <DialogTitle>Add new address</DialogTitle>

            <form className="flex flex-wrap gap-4 py-2 w-full" onSubmit={handleSave}>
              <div className="flex md:flex-row sm:flex-col gap-4 w-full">
                <TxtField
                  label="Full name"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <TxtField
                  label="Phone number"
                  type="tel"
                  variant="outline"
                  size="sm"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Textarea
                label="Street name"
                type="text"
                variant="outline"
                size="sm"
                placeholder="Nama jalan, nomor rumah, RT/RW"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />

              {/* ===== Kota/Kab ===== */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Kota/Kab (cari dulu)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder='Ketik: "Cimahi", "Bandung"...'
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                />
                <p className="text-xs text-neutral-500">{loadingCities ? "Mencari kota..." : ""}</p>

                <Select value={cityId} onValueChange={setCityId} disabled={!cities.length || loadingCities}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!cities.length ? "Tidak ada hasil" : "Pilih Kota/Kab"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Hasil Kota/Kab</SelectLabel>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* ===== Kecamatan ===== */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Cari kecamatan (optional)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Ketik untuk filter kecamatan"
                  value={districtQuery}
                  onChange={(e) => setDistrictQuery(e.target.value)}
                  disabled={!cityId}
                />
                <p className="text-xs text-neutral-500">{loadingDistricts ? "Load kecamatan..." : ""}</p>

                <Select value={districtId} onValueChange={setDistrictId} disabled={!cityId || !districts.length}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!cityId ? "Pilih kota dulu" : "Pilih Kecamatan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Kecamatan</SelectLabel>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* ===== Kelurahan ===== */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Cari kelurahan (optional)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Ketik untuk filter kelurahan"
                  value={subQuery}
                  onChange={(e) => setSubQuery(e.target.value)}
                  disabled={!districtId}
                />
                <p className="text-xs text-neutral-500">{loadingSubs ? "Load kelurahan..." : ""}</p>

                <Select value={subId} onValueChange={setSubId} disabled={!districtId || !subs.length}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!districtId ? "Pilih kecamatan dulu" : "Pilih Kelurahan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Kelurahan</SelectLabel>
                      {subs.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* ===== Kode Pos ===== */}
              <div className="space-y-2 w-full">
                <Select value={postalCode} onValueChange={setPostalCode} disabled={!subId || !postalCodes.length}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!subId ? "Pilih kelurahan dulu" : "Pilih Kode Pos"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Kode Pos</SelectLabel>
                      {postalCodes.map((z) => (
                        <SelectItem key={z} value={String(z)}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-neutral-500">
                  Kode pos di DB kamu saat ini 1 kelurahan = 1 kode pos. Kalau mau 1 kelurahan bisa banyak kode pos,
                  nanti kita tambah tabel mapping.
                </p>
              </div>

              <div className="w-full flex gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save address"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
