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

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function cleanStr(s) {
  return String(s || "").trim();
}

/**
 * Parse format umum Biteship:
 * "Cimahi Tengah, Cimahi, Jawa Barat. 40525"
 * district/kecamatan = parts[0]
 * city/kota = parts[1]
 * province = parts[2]
 * postal = field postal_code / suffix ". 40525"
 */
function parseBiteshipName(name, fallbackPostal) {
  const raw = String(name || "").trim();

  const m = raw.match(/\.\s*(\d{4,6})\s*$/);
  const postalFromSuffix = m?.[1] || "";

  const noZip = raw.replace(/\.\s*\d{4,6}\s*$/i, "").trim();

  const parts = noZip
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const district = parts[0] || "";
  const city = parts[1] || "";
  const province = parts[2] || "";

  const postal = cleanStr(fallbackPostal) || cleanStr(postalFromSuffix) || "";

  return { district, city, province, postal, label: noZip };
}

export function NewAddress({ onSuccess }) {
  const [open, setOpen] = useState(false);

  // ===== Form =====
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");

  // ===== Biteship search =====
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areasRaw, setAreasRaw] = useState([]);

  // ===== Dropdown step-by-step =====
  const [cityValue, setCityValue] = useState("");
  const [districtValue, setDistrictValue] = useState("");
  const [postalValue, setPostalValue] = useState("");

  // Kelurahan manual
  const [kelurahan, setKelurahan] = useState("");

  // Biteship data to save
  const [areaId, setAreaId] = useState("");
  const [areaName, setAreaName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  // parsed
  const parsedAreas = useMemo(() => {
    const arr = Array.isArray(areasRaw) ? areasRaw : [];
    return arr
      .map((a) => {
        const postal = a?.postal_code ?? a?.postalCode ?? "";
        const parsed = parseBiteshipName(a?.name, postal);
        return {
          raw: a,
          id: a?.id,
          name: a?.name || "",
          ...parsed,
        };
      })
      .filter((x) => x.id && (x.city || x.district || x.postal));
  }, [areasRaw]);

  const cityOptions = useMemo(() => {
    const base = parsedAreas
      .filter((x) => x.city)
      .map((x) => ({ value: x.city, label: x.city }));
    return uniqBy(base, (x) => x.value);
  }, [parsedAreas]);

  const districtOptions = useMemo(() => {
    if (!cityValue) return [];
    const base = parsedAreas
      .filter((x) => x.city === cityValue && x.district)
      .map((x) => ({ value: x.district, label: x.district }));
    return uniqBy(base, (x) => x.value);
  }, [parsedAreas, cityValue]);

  const postalOptions = useMemo(() => {
    if (!cityValue || !districtValue) return [];
    const base = parsedAreas
      .filter((x) => x.city === cityValue && x.district === districtValue && x.postal)
      .map((x) => ({ value: x.postal, label: x.postal }));
    return uniqBy(base, (x) => x.value);
  }, [parsedAreas, cityValue, districtValue]);

  const resetAll = () => {
    setFullName("");
    setPhone("");
    setStreet("");

    setSearchQuery("");
    setAreasRaw([]);
    setLoadingAreas(false);

    setCityValue("");
    setDistrictValue("");
    setPostalValue("");

    setKelurahan("");

    setAreaId("");
    setAreaName("");
    setPostalCode("");

    setSaving(false);
  };

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch areas (naikin limit)
  useEffect(() => {
    if (!open) return;

    const q = String(searchQuery || "").trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q || q.length < 3) {
      setAreasRaw([]);
      setCityValue("");
      setDistrictValue("");
      setPostalValue("");
      setAreaId("");
      setAreaName("");
      setPostalCode("");
      return;
    }

    timerRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      setLoadingAreas(true);

      try {
        const res = await axios.get("/areas", {
          params: {
            input: q,
            countries: "ID",
            type: "single",
            // ✅ coba beberapa nama param biar kompatibel sama backend/proxy kamu
            limit: 100,
            per_page: 100,
            page: 1,
          },
        });

        if (reqId !== reqIdRef.current) return;

        const list = res.data?.serve || [];
        const arr = Array.isArray(list) ? list : [];
        setAreasRaw(arr);

        // reset chain setiap data baru masuk
        setCityValue("");
        setDistrictValue("");
        setPostalValue("");
        setAreaId("");
        setAreaName("");
        setPostalCode("");
      } catch (e) {
        console.error(e);
        if (reqId !== reqIdRef.current) return;
        setAreasRaw([]);
      } finally {
        if (reqId === reqIdRef.current) setLoadingAreas(false);
      }
    }, 450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery, open]);

  useEffect(() => {
    setDistrictValue("");
    setPostalValue("");
    setAreaId("");
    setAreaName("");
    setPostalCode("");
  }, [cityValue]);

  useEffect(() => {
    setPostalValue("");
    setAreaId("");
    setAreaName("");
    setPostalCode("");
  }, [districtValue]);

  useEffect(() => {
    if (!postalValue || !cityValue || !districtValue) {
      setAreaId("");
      setAreaName("");
      setPostalCode("");
      return;
    }

    const match = parsedAreas.find(
      (x) => x.city === cityValue && x.district === districtValue && x.postal === postalValue
    );

    if (!match) {
      setAreaId("");
      setAreaName("");
      setPostalCode("");
      return;
    }

    setAreaId(String(match.id));
    setAreaName(match.name || match.label || "");
    setPostalCode(String(match.postal || ""));
  }, [postalValue, cityValue, districtValue, parsedAreas]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving) return;

    if (!fullName.trim()) return alert("Full name wajib diisi");
    if (!phone.trim()) return alert("Phone number wajib diisi");
    if (!street.trim()) return alert("Street name wajib diisi");

    if (!cityValue) return alert("Pilih Kota/Kab dulu");
    if (!districtValue) return alert("Pilih Kecamatan dulu");
    if (!postalValue) return alert("Pilih Kode Pos dulu");
    if (!kelurahan.trim()) return alert("Kelurahan wajib diisi (manual).");
    if (!areaId) return alert("Area Biteship belum kebentuk. Pilih ulang kode pos.");

    try {
      setSaving(true);

      const fullAddress = `${street}
Kel. ${kelurahan}
Kec. ${districtValue}
${cityValue} ${postalValue}`.trim();

      await axios.post("/addresses", {
        address: fullAddress,

        pic_name: fullName,
        pic_phone: phone,
        pic_label: "Home",
        benchmark: "",
        is_active: 2,

        area_id: areaId,
        area_name: areaName,
        postal_code: postalCode,

        kota_kab: cityValue,
        kecamatan: districtValue,
        kelurahan,
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
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetAll();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="primary" size="sm" iconName="Plus">
            Add new address
          </Button>
        </DialogTrigger>

        {/* ✅ PENTING: DialogContent jangan overflow-y-auto (biar dropdown nggak ke-clip).
            Kita bikin bagian formnya yang scroll, bukan container modalnya. */}
        <DialogContent className="sm:max-w-[300px] md:max-w-[425px] overflow-visible">
          <DialogHeader>
            <DialogTitle>Add new address</DialogTitle>
          </DialogHeader>

          {/* ✅ area scroll */}
          <div className="w-full max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
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

              {/* Search */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Cari kota/area (Biteship)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder='Ketik contoh: "Cimahi", "Bandung"...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  Minimal 3 karakter. {loadingAreas ? "Mencari..." : ""}
                </p>
              </div>

              {/* Kota */}
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Kota/Kab</p>
                <Select
                  value={cityValue}
                  onValueChange={(v) => setCityValue(v)}
                  disabled={!cityOptions.length || loadingAreas}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAreas
                          ? "Loading..."
                          : !searchQuery.trim()
                            ? "Ketik dulu di search"
                            : !cityOptions.length
                              ? "Tidak ada kota ditemukan"
                              : "Pilih Kota/Kab"
                      }
                    />
                  </SelectTrigger>

                  {/* ✅ bikin list scrollable */}
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectGroup>
                      <SelectLabel>Hasil Kota/Kab</SelectLabel>
                      {cityOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Kecamatan */}
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Kecamatan</p>
                <Select
                  value={districtValue}
                  onValueChange={(v) => setDistrictValue(v)}
                  disabled={!cityValue || !districtOptions.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!cityValue ? "Pilih kota dulu" : "Pilih Kecamatan"} />
                  </SelectTrigger>

                  {/* ✅ scroll dropdown */}
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectGroup>
                      <SelectLabel>Kecamatan (dari Biteship)</SelectLabel>
                      {districtOptions.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                {/* Info kalau kecamatan sedikit */}
                {cityValue && !loadingAreas && districtOptions.length > 0 && districtOptions.length < 3 ? (
                  <p className="text-[11px] text-neutral-500">
                    Kalau kecamatan masih sedikit, coba ketik pencarian lebih spesifik:
                    <span className="font-medium"> “cimahi selatan”</span> / <span className="font-medium">“cimahi utara”</span>.
                  </p>
                ) : null}
              </div>

              {/* Kode pos */}
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Kode Pos</p>
                <Select
                  value={postalValue}
                  onValueChange={(v) => setPostalValue(v)}
                  disabled={!districtValue || !postalOptions.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!districtValue ? "Pilih kecamatan dulu" : "Pilih Kode Pos"} />
                  </SelectTrigger>

                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectGroup>
                      <SelectLabel>Kode pos (wilayah kelurahan)</SelectLabel>
                      {postalOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-neutral-500">
                  Pilih kode pos sesuai wilayah kelurahan kamu, lalu isi kelurahan manual.
                </p>
              </div>

              {/* Kelurahan manual */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Kelurahan (isi manual)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Contoh: Setiamanah, Cibabat, Melong..."
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  disabled={!postalValue}
                />
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
