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

export function EditAddress({ address, onSuccess }) {
  const [open, setOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [benchmark, setBenchmark] = useState("");

  const [areaQuery, setAreaQuery] = useState("");
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (!open || !address) return;

    setFullName(address.pic_name || "");
    setPhone(address.pic_phone || "");
    setStreet(address.address || "");
    setBenchmark(address.benchmark || "");

    setAreaQuery(address.area_name || "");
    setAreaId(String(address.area_id || ""));
    setPostalCode(address.postal_code || "");
  }, [open, address]);

  const selectedArea = useMemo(
    () => areas.find((a) => String(a.id) === String(areaId)) || null,
    [areas, areaId]
  );

  /* ================= SEARCH AREA ================= */
  useEffect(() => {
    if (!open) return;

    const q = areaQuery.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.length < 3) return;

    timerRef.current = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      setLoadingAreas(true);

      try {
        const res = await axios.get("/areas", {
          params: { input: q, countries: "ID", type: "single" },
        });

        if (reqId !== reqIdRef.current) return;
        setAreas(res.data?.serve || []);
      } catch (e) {
        setAreas([]);
      } finally {
        if (reqId === reqIdRef.current) setLoadingAreas(false);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [areaQuery, open]);

  /* ================= POSTAL AUTO ================= */
  useEffect(() => {
    if (!selectedArea) return;
    setPostalCode(
      selectedArea.postal_code || selectedArea.postalCode || ""
    );
  }, [selectedArea]);

  /* ================= SAVE ================= */
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);

      await axios.put(`/addresses/${address.id}`, {
        address: street,
        benchmark,
        pic_name: fullName,
        pic_phone: phone,
        pic_label: address.pic_label || "Home",

        area_id: areaId,
        area_name: selectedArea?.name || areaQuery,
        postal_code: postalCode,
      });

      onSuccess?.();
      setOpen(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Gagal update address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="sm">
          Edit address
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106 h-[80%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit address</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-4">
            <TxtField
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <TxtField
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Textarea
            label="Alamat Lengkap"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />

          <TxtField
            label="Patokan (opsional)"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
          />

          <TxtField
            label="Kecamatan"
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
          />

          <Select value={areaId} onValueChange={setAreaId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Area Tujuan" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Alamat Tujuan</SelectLabel>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <TxtField label="Kode Pos" value={postalCode} readOnly />
          
          <div className="w-full flex gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
