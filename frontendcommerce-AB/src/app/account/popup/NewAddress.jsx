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

  // biteship search
  const [areaQuery, setAreaQuery] = useState("");
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaId, setAreaId] = useState("");
  const [postalCode, setPostalCode] = useState("");

   const [kecamatan, setKecamatan] = useState("");
  const [kelurahan, setKelurahan] = useState("");

  

  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  const selectedArea = useMemo(() => {
    return areas.find((a) => String(a.id) === String(areaId)) || null;
  }, [areas, areaId]);
  


  const pickAreaField = (area, keys) => {
    if (!area) return "";
    for (const key of keys) {
      const val = area?.[key];
      if (val) return String(val);
    }
    return "";
  };

  const parseAreaNameParts = (areaName) => {
    if (!areaName) return { kelurahan: "", kecamatan: "" };
    const parts = String(areaName)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return {
      kelurahan: parts[0] || "",
      kecamatan: parts[1] || "",
    };
  };

  const resetAll = () => {
    setFullName("");
    setPhone("");
    setStreet("");

    setAreaQuery("");
    setAreas([]);
    setAreaId("");
    setPostalCode("");

    setSaving(false);
    setLoadingAreas(false);

    setKecamatan("");
    setKelurahan("");
  };

  // reset ketika dialog ditutup
  useEffect(() => {
    if (!open) {
      resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // fetch areas with debounce
  useEffect(() => {
    if (!open) return;

    const q = String(areaQuery || "").trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    // kalau user masih kosongin query, reset list
    if (!q) {
      setAreas([]);
      setAreaId("");
      setPostalCode("");
      setLoadingAreas(false);
      return;
    }

    // biar gak spam API untuk 1-2 huruf
    if (q.length < 3) {
      setAreas([]);
      setAreaId("");
      setPostalCode("");
      setLoadingAreas(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      setLoadingAreas(true);

      try {
        const res = await axios.get("/areas", {
          params: { input: q, countries: "ID", type: "single" },
        });

        if (reqId !== reqIdRef.current) return;

        const list = res.data?.serve || [];
        const arr = Array.isArray(list) ? list : [];
        setAreas(arr);

        // kalau selection yang lama gak ada di hasil baru, reset
        setAreaId((prev) => {
          if (!prev) return "";
          const exists = arr.some((a) => String(a.id) === String(prev));
          return exists ? prev : "";
        });
      } catch (e) {
        console.error(e);
        if (reqId !== reqIdRef.current) return;
        setAreas([]);
      } finally {
        if (reqId === reqIdRef.current) setLoadingAreas(false);
      }
    }, 450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [areaQuery, open]);

  // auto-fill postal code when area chosen
  useEffect(() => {
    if (!selectedArea) {
      setPostalCode("");
      setKecamatan("");
      setKelurahan("");
      return;
    }
    const zip = selectedArea.postal_code || selectedArea.postalCode || "";
      const parsed = parseAreaNameParts(selectedArea.name);
    setPostalCode(String(zip || ""));
    setKecamatan(
      pickAreaField(selectedArea, [
        "administrative_area_level_3",
        "administrative_area_level3",
        "district",
        "kecamatan",
      ]) || parsed.kecamatan
    );
    setKelurahan(
      pickAreaField(selectedArea, [
        "administrative_area_level_4",
        "administrative_area_level4",
        "subdistrict",
        "sub_district",
        "subDistrict",
        "kelurahan",
      ]) || parsed.kelurahan
    );
  }, [selectedArea]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving) return;

    if (!fullName.trim()) return alert("Full name wajib diisi");
    if (!phone.trim()) return alert("Phone number wajib diisi");
    if (!street.trim()) return alert("Street name wajib diisi");
    if (!areaId) return alert("Area tujuan wajib dipilih (hasil search Biteship).");

    try {
      setSaving(true);

      const picked = selectedArea;
      if (!picked) return alert("Area tujuan tidak valid. Coba search dan pilih ulang.");

      await axios.post("/addresses", {
        address: street,

        pic_name: fullName,
        pic_phone: phone,
        pic_label: "Home",
        benchmark: "",
        is_active: 2,

        // ✅ search biteship
        area_id: picked.id,
        area_name: picked.name || "",
        postal_code: postalCode || picked.postal_code || "",
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
                placeholder="Enter your address"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />

              {/* Search Area */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Search area (Biteship)"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder='Ketik contoh: "Bandung", "Cimahi", "Sudirman Bandung"...'
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  Minimal 3 karakter. {loadingAreas ? "Mencari..." : ""}
                </p>
              </div>

              {/* Select hasil area */}
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Choose area</p>
                <Select
                  value={areaId}
                  onValueChange={(val) => setAreaId(val)}
                  disabled={!areas.length || loadingAreas}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAreas
                          ? "Searching area..."
                          : !areaQuery.trim()
                            ? "Ketik di search dulu"
                            : !areas.length
                              ? "Tidak ada hasil"
                              : "Select area"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Area results</SelectLabel>
                       {areas.map((a) => {
                        const parsed = parseAreaNameParts(a?.name);
                        const areaKecamatan = pickAreaField(a, [
                          "administrative_area_level_3",
                          "administrative_area_level3",
                          "district",
                          "kecamatan",
                        ]) || parsed.kecamatan;
                        const areaKelurahan = pickAreaField(a, [
                          "administrative_area_level_4",
                          "administrative_area_level4",
                          "subdistrict",
                          "sub_district",
                          "subDistrict",
                          "kelurahan",
                        ]) || parsed.kelurahan;

                        return (
                          <SelectItem key={a.id} value={String(a.id)}>
                            <div className="flex flex-col">
                              <span className="font-medium">{a.name}</span>
                              <span className="text-xs text-neutral-500">
                                {areaKecamatan ? `Kecamatan: ${areaKecamatan}` : ""}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {areaKelurahan ? `Kelurahan: ${areaKelurahan}` : ""}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

               {/* Kecamatan & Kelurahan (auto) */}
              <div className="space-y-2 w-full">
                <TxtField
                  label="Kecamatan"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Auto from selected area"
                  value={kecamatan}
                  readOnly
                />
              </div>
              <div className="space-y-2 w-full">
                <TxtField
                  label="Kelurahan"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Auto from selected area"
                  value={kelurahan}
                  readOnly
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
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
