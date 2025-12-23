"use client";
import { useState } from "react";
import { FaBriefcase } from "react-icons/fa6";
import { Button, Chip } from "../../components";


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

  // const handleToggle = async () => {
  //   if (loading) return;
  //   const newPressed = !pressed;
  //   const newValue = newPressed ? 2 : 1;

  //   setPressed(newPressed);
  //   setLoading(true);
  //   try {
  //     const body = {
  //       id,
  //       is_active: newValue,
  //       province,
  //       city,
  //       district,
  //       subdistrict,
  //       postal_code: postalCode,
  //     };
  //     console.log("[PUT] /addresses payload =", body);

  //     await api.put("/addresses", body);

  //     if (newValue === 2 && onUpdated) onUpdated(id);
  //   } catch (err) {
  //     console.log("AXIOS ERROR SNAPSHOT >>>", {
  //       status: err?.response?.status,
  //       data: err?.response?.data,
  //       url: err?.config?.url,
  //       baseURL: err?.config?.baseURL,
  //       sent: err?.config?.data,
  //     });
  //     setPressed(!newPressed);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
