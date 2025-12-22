"use client";
import { useMemo, useState } from "react";
import { FaBriefcase } from "react-icons/fa6";
import { Button, Chip } from "../../components";

function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

export function AddressCard(props) {
  const [loading] = useState(false);

  // ✅ tahan banting: support camelCase & snake_case
  const id = pick(props, ["id"], null);
  const label = pick(props, ["label", "picLabel", "pic_label"], "Home");
  const line = pick(props, ["line", "address"], "");
  const postalCode = pick(props, ["postalCode", "postal_code", "postalCode"], "");
  const name = pick(props, ["name", "picName", "pic_name"], "");
  const phone = pick(props, ["phone", "picPhone", "pic_phone"], "");
  const benchmark = pick(props, ["benchmark"], "");

  // ini yang penting: biteship area name
  const areaName = pick(props, ["areaName", "biteshipAreaName", "biteship_area_name"], "");

  // fallback kalau alamat lama masih ada city/province name
  const city = pick(props, ["cityName", "city"], "");
  const province = pick(props, ["provinceName", "province"], "");
  const district = pick(props, ["districtName", "district"], "");
  const subdistrict = pick(props, ["subdistrictName", "subdistrict", "subDistrict"], "");

  const selected = !!props.selected;
  const disabled = !!props.disabled;
  const onSelect = props.onSelect;

  const locationLine = useMemo(() => {
    // ✅ prioritas biteship
    if (areaName) return areaName;

    // ✅ fallback alamat lama (kalau kamu preload nama-nama)
    const parts = [subdistrict, district, city, province].filter(Boolean);
    return parts.length ? parts.join(", ") : "";
  }, [areaName, city, province, district, subdistrict]);

  const handleClick = () => {
    if (disabled || !id) return;
    onSelect?.(id);
  };

  return (
    <div className="bg-white rounded-xl space-y-4 p-4 w-full">
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-neutral-950">
          <FaBriefcase />
          <span className="text-sm font-bold">{label}</span>
        </div>

        <Chip isActive={selected} onClick={handleClick} disabled={disabled}>
          {loading ? "Updating…" : selected ? "Main address" : "Set as main address"}
        </Chip>
      </div>

      <div className="space-y-2 p-4 bg-muted rounded-xl border">
        <div className="space-y-1">
          {/* ✅ Jadikan alamat jalan sebagai utama */}
          <div className="text-sm font-medium text-neutral-900">
            {line || "—"}
          </div>

          {/* ✅ Lokasi: biteship_area_name atau fallback */}
          <div className="text-neutral-500 text-sm">
            {locationLine || "—"}
          </div>

          <div className="text-neutral-500 text-sm">
            {postalCode || "—"}
          </div>

          {benchmark ? (
            <div className="text-neutral-400 text-xs mt-2">{benchmark}</div>
          ) : null}
        </div>

        <hr className="w-full border-t border-neutral-200 my-4" />

        <div className="text-xs">{name || "—"}</div>
        <div className="text-xs">{phone || "—"}</div>
      </div>

      <div className="flex gap-4">
        <Button variant="tertiary" size="sm">
          Edit address
        </Button>
        <Button variant="tertiary" size="sm">
          Delete
        </Button>
      </div>
    </div>
  );
}
