"use client";
import { useState } from "react";
import { FaBriefcase } from "react-icons/fa6";
import { Button, Chip } from "../../components";
import { EditAddress } from "./popup/editAddress";
import { DeleteAddress } from "./popup/deleteAddress";


export function AddressCard({
  id,
  label,
  line,
  city,
  province,
  postalCode,
  phone,
  name,
  district,
  subdistrict,
  isActive,
  benchmark,
  onUpdated,
  selected = false,
  disabled = false,
  onSelect,
}) {
  const [loading, setLoading] = useState(false);

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
          {loading
            ? "Updating…"
            : selected
              ? "Main address"
              : "Set as main address"}
        </Chip>
      </div>

      <div className="space-y-2 p-4 bg-muted rounded-xl border">
        <div className="space-y-2">
          <h3 className="title">{benchmark}</h3>
          <span className="text-neutral-500 text-sm block">
            <p>{line || "—"}</p>
            <p>{[city, province].filter(Boolean).join(", ") || "—"}</p>
            <p>{postalCode || "—"}</p>
          </span>
        </div>
        <hr className="w-full border-t border-neutral-200 my-4" />
        <div className="text-xs">{name || "—"}</div>
        <div className="text-xs">{phone || "—"}</div>
      </div>

      <div className="flex gap-4">
        <EditAddress
          address={{
            id,
            pic_name: name,
            pic_phone: phone,
            address: line,
            area_id: district,
            area_name: `${subdistrict}, ${city}`,
            postal_code: postalCode,
            benchmark,
            pic_label: label,
          }}
          onSuccess={onUpdated}
        />
        <DeleteAddress
          address={{
            id,
            pic_label: label,
            address: line,
            area_name: `${subdistrict}, ${city}`,
            postal_code: postalCode,
          }}
          onSuccess={onUpdated}
        />
      </div>
    </div>
  );
}
