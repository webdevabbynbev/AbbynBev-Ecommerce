"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "@/lib/axios";
import { Textarea } from "@/components";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TxtField,
} from "@/components";

import AsyncSelect from "react-select/async";

export function NewAddress({ onSuccess }) {
  const [open, setOpen] = useState(false);

  // Basic info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");

  // Address hierarchy - REVERSE ORDER
  const [district, setDistrict] = useState(null);
  const [city, setCity] = useState(null);
  const [province, setProvince] = useState(null);
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);

  // Cache untuk hemat API
  const areaCache = useRef(new Map());
  const allAreasRef = useRef([]);

  /* =========================
   * Helpers
   * ========================= */

  const parseArea = (area) => {
    const parts = area.name.split(",").map((p) => p.trim());

    return {
      id: area.id,
      kecamatan: parts[0] ?? "",
      kota: parts[1] ?? "",
      provinsi: parts[2] ?? "",
      postalCode: area.postal_code ?? "",
      fullName: area.name,
    };
  };

  const loadAreas = async (inputValue) => {
    const searchInput = inputValue || "";
    const cacheKey = searchInput || "default";

    if (areaCache.current.has(cacheKey)) {
      return areaCache.current.get(cacheKey);
    }

    try {
      const res = await axios.get("/areas", {
        params: {
          input: searchInput,
          countries: "ID",
          type: "single",
        },
      });

      const areas = res.data?.serve || [];

      areas.forEach(area => {
        const exists = allAreasRef.current.find(a => a.id === area.id);
        if (!exists) {
          allAreasRef.current.push(area);
        }
      });

      const options = areas.map((a) => {
        const parsed = parseArea(a);
        return {
          value: a.id,
          label: a.name,
          data: parsed,
          raw: a,
        };
      });

      areaCache.current.set(cacheKey, options);
      return options;
    } catch (err) {
      console.error("Error loading areas:", err);
      return [];
    }
  };

  // STEP 1: Load kecamatan dulu (most specific)
  const loadDistricts = async (input) => {
    const list = await loadAreas(input || "kecamatan");

    // Return semua kecamatan dengan info lengkap
    const districts = list.map((o) => ({
      value: o.value, // ID biteship area
      label: `${o.data.kecamatan}, ${o.data.kota}, ${o.data.provinsi}`, // Full display
      data: o.data,
    }));

    return districts.sort((a, b) => a.data.kecamatan.localeCompare(b.data.kecamatan));
  };

  const resetAll = () => {
    setFullName("");
    setPhone("");
    setStreet("");
    setDistrict(null);
    setCity(null);
    setProvince(null);
    setPostalCode("");
    setSaving(false);
  };

  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open]);

  /* =========================
   * Submit
   * ========================= */

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving) return;

    if (!fullName.trim()) return alert("Nama lengkap wajib diisi");
    if (!phone.trim()) return alert("Nomor telepon wajib diisi");
    if (!street.trim()) return alert("Alamat lengkap wajib diisi");
    if (!district) return alert("Kecamatan wajib dipilih");

    try {
      setSaving(true);

      const data = {
        address: street,
        pic_name: fullName,
        pic_phone: phone,
        pic_label: "Home",
        is_active: 2,
        province: province.value.split(".")[0].trim(),
        city: city.value,
        district: district.data.kecamatan,
        postal_code: postalCode,
        area_id: district.value, // ID area kecamatan dari biteship
        area_name: district.label
      }

      await axios.post("/addresses", data);

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

  /* =========================
   * Render
   * ========================= */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" iconName="Plus">
          Add new address
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col sm:max-w-75 md:max-w-106.25 h-[80%] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Add new address</DialogTitle>

          <div className="flex flex-wrap gap-4 py-2 w-full">
            <div className="flex md:flex-row sm:flex-col gap-4 w-full">
              <TxtField
                label="Nama Lengkap"
                variant="outline"
                size="sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <TxtField
                label="Phone number"
                type="tel"
                variant="outline"
                size="sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Textarea
              label="Alamat Lengkap"
              variant="outline"
              size="sm"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />

            {/* STEP 1: Pilih Kecamatan dulu */}
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <AsyncSelect
                classNamePrefix="rs"
                cacheOptions
                defaultOptions
                loadOptions={loadDistricts}
                value={district}
                onChange={(val) => {
                  setDistrict(val);
                  // Auto-fill kota dan provinsi dari data kecamatan
                  if (val) {
                    setCity({
                      value: val.data.kota,
                      label: val.data.kota,
                      data: { kota: val.data.kota, provinsi: val.data.provinsi }
                    });
                    setProvince({
                      value: val.data.provinsi,
                      label: val.data.provinsi,
                      data: { provinsi: val.data.provinsi }
                    });
                    setPostalCode(val.data.postalCode || "");
                  } else {
                    setCity(null);
                    setProvince(null);
                    setPostalCode("");
                  }
                }}
                placeholder="Cari kecamatan"
                isClearable
                noOptionsMessage={() => "Ketik nama kecamatan untuk mencari"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mulai dengan kecamatan, kota dan provinsi akan terisi otomatis
              </p>
            </div>

            {/* STEP 2: Kota (auto-filled, read-only) */}
            <TxtField
              label="Kota / Kabupaten"
              variant="outline"
              size="sm"
              value={city?.value || ""}
              readOnly
              placeholder="Otomatis terisi dari kecamatan..."
            />

            {/* STEP 3: Provinsi (auto-filled, read-only) */}
            <TxtField
              label="Provinsi"
              variant="outline"
              size="sm"
              value={province?.value || ""}
              readOnly
              placeholder="Otomatis terisi dari kecamatan..."
            />

            <TxtField
              label="Kode Pos"
              value={postalCode}
              readOnly
              variant="outline"
              size="sm"
            />

            <div className="w-full flex gap-3">
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save address"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}