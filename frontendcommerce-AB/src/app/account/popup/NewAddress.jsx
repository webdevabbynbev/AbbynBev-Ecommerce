"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // dropdown data
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingSubDistrict, setLoadingSubDistrict] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedSub = useMemo(() => {
    return subDistricts.find((s) => String(s.id) === String(subDistrictId)) || null;
  }, [subDistricts, subDistrictId]);

  const resetAll = () => {
    setFullName("");
    setPhone("");
    setStreet("");
    setProvinceId("");
    setCityId("");
    setDistrictId("");
    setSubDistrictId("");
    setPostalCode("");

    setCities([]);
    setDistricts([]);
    setSubDistricts([]);
  };

  // load provinces when dialog opens
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingProvince(true);
        const res = await axios.get("/province"); // -> /api/v1/province
        const list = res.data?.serve || res.data?.data || [];
        setProvinces(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert("Gagal memuat provinsi. Pastikan kamu sudah login & backend running.");
        setProvinces([]);
      } finally {
        setLoadingProvince(false);
      }
    })();
  }, [open]);

  // cascade: province -> city
  useEffect(() => {
    if (!provinceId) return;

    setCityId("");
    setDistrictId("");
    setSubDistrictId("");
    setPostalCode("");
    setCities([]);
    setDistricts([]);
    setSubDistricts([]);

    (async () => {
      try {
        setLoadingCity(true);
        const res = await axios.get("/city", { params: { province: provinceId } });
        const list = res.data?.serve || res.data?.data || [];
        setCities(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert("Gagal memuat kota/kabupaten.");
        setCities([]);
      } finally {
        setLoadingCity(false);
      }
    })();
  }, [provinceId]);

  // cascade: city -> district
  useEffect(() => {
    if (!cityId) return;

    setDistrictId("");
    setSubDistrictId("");
    setPostalCode("");
    setDistricts([]);
    setSubDistricts([]);

    (async () => {
      try {
        setLoadingDistrict(true);
        const res = await axios.get("/district", { params: { city: cityId } });
        const list = res.data?.serve || res.data?.data || [];
        setDistricts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert("Gagal memuat kecamatan.");
        setDistricts([]);
      } finally {
        setLoadingDistrict(false);
      }
    })();
  }, [cityId]);

  // cascade: district -> subdistrict
  useEffect(() => {
    if (!districtId) return;

    setSubDistrictId("");
    setPostalCode("");
    setSubDistricts([]);

    (async () => {
      try {
        setLoadingSubDistrict(true);
        const res = await axios.get("/sub-district", { params: { district: districtId } });
        const list = res.data?.serve || res.data?.data || [];
        setSubDistricts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        alert("Gagal memuat kelurahan/desa.");
        setSubDistricts([]);
      } finally {
        setLoadingSubDistrict(false);
      }
    })();
  }, [districtId]);

  // auto-fill postal code when subdistrict chosen
  useEffect(() => {
    if (!selectedSub) return;
    const zip = selectedSub.zip_code || selectedSub.zipCode || "";
    setPostalCode(String(zip || ""));
  }, [selectedSub]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (saving) return;

    // simple validation
    if (!fullName.trim()) return alert("Full name wajib diisi");
    if (!phone.trim()) return alert("Phone number wajib diisi");
    if (!street.trim()) return alert("Street name wajib diisi");
    if (!provinceId || !cityId || !districtId || !subDistrictId)
      return alert("Provinsi / Kota / Kecamatan / Kelurahan wajib dipilih");

    try {
      setSaving(true);

      // payload sesuai backend routes kamu: POST /addresses
      await axios.post("/addresses", {
        address: street,
        province: Number(provinceId),
        city: Number(cityId),
        district: Number(districtId),
        subdistrict: Number(subDistrictId),

        pic_name: fullName,
        pic_phone: phone,
        pic_label: "Home",
        benchmark: "",
        is_active: 2, // jadikan primary
        postal_code: postalCode, // optional (kalau backend kamu pakai dari zip_code juga ok)
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

              {/* Province */}
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Province</p>
                <Select
                  value={provinceId}
                  onValueChange={(val) => setProvinceId(val)}
                  disabled={loadingProvince}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={loadingProvince ? "Loading province..." : "Select province"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Province</SelectLabel>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          <div>{p.name}</div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* City / District / Subdistrict */}
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">City</h6>
                  <Select
                    value={cityId}
                    onValueChange={(val) => setCityId(val)}
                    disabled={!provinceId || loadingCity}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !provinceId
                            ? "Select province first"
                            : loadingCity
                              ? "Loading city..."
                              : "Select city"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>City</SelectLabel>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            <div>{c.name}</div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">District</h6>
                  <Select
                    value={districtId}
                    onValueChange={(val) => setDistrictId(val)}
                    disabled={!cityId || loadingDistrict}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !cityId
                            ? "Select city first"
                            : loadingDistrict
                              ? "Loading district..."
                              : "Select district"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>District</SelectLabel>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            <div>{d.name}</div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">Sub district</h6>
                  <Select
                    value={subDistrictId}
                    onValueChange={(val) => setSubDistrictId(val)}
                    disabled={!districtId || loadingSubDistrict}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !districtId
                            ? "Select district first"
                            : loadingSubDistrict
                              ? "Loading subdistrict..."
                              : "Select subdistrict"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sub district</SelectLabel>
                        {subDistricts.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            <div>{s.name}</div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Postal code (auto) */}
                <div className="space-y-2 w-full md:col-span-3 sm:col-span-2">
                  <TxtField
                    label="Postal code"
                    variant="outline"
                    size="sm"
                    type="text"
                    placeholder="Auto from subdistrict"
                    value={postalCode}
                    readOnly
                  />
                </div>
              </div>

              <div className="w-full flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save address"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
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
