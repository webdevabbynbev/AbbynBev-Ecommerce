"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { getAddressByQuery, getUser } from "@/services/auth";
import { AddressCard } from ".";
import { useLocationNames } from "@/app/hooks/useLocationNames";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const isNumericLike = (v) => v !== null && v !== undefined && String(v).trim() !== "" && !Number.isNaN(Number(v));

export function AddressList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const { provinceMap, cityMap } = useLocationNames(list); 

  // ---- load addresses
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { user } = await getUser();
        if (!user?.id) throw new Error("User ID not found");

        const addr = await getAddressByQuery(user.id);
        if (!alive) return;

        const data = Array.isArray(addr) ? addr : [];
        setList(data);

        console.log(data);
        

        // set pilihan awal (yang isActive === 2) kalau ada, kalau tidak pilih item pertama
        const main = data.find((x) => Number(x.isActive) === 2);
        setSelectedId(main ? main.id : data[0]?.id ?? null);

      } catch (e) {
        if (alive) setErr(e?.message || "Gagal memuat alamat");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- handle select main address
  const handleSelect = async (id) => {
    if (saving || id == null || id === selectedId) return;
    setSaving(true);

    // Optimistic UI
    const prev = list;
    setSelectedId(id);
    setList((cur) => cur.map((a) => ({ ...a, isActive: a.id === id ? 2 : 1 })));

    try {
      await api.put("/addresses", { id, is_active: 2 });
    } catch (err) {
      console.error("Select main address failed:", err?.response?.data || err);
      setList(prev);
      setSelectedId(prev.find((x) => Number(x.isActive) === 2)?.id ?? prev[0]?.id ?? null);
    } finally {
      setSaving(false);
    }
  };

  // ---- derived list with display-friendly names
  const displayList = useMemo(() => {
    return (Array.isArray(list) ? list : []).map((a) => {
      const cityVal = a?.city;
      const provVal = a?.province;

      const areaName =
        a?.biteshipAreaName ||
        a?.biteship_area_name ||
        a?.areaName ||
        a?.area_name ||
        "";
      const cityName =
        a?.cityName ||
        a?.city_name ||
        (typeof cityVal === "string" && !isNumericLike(cityVal) ? cityVal : cityMap[String(cityVal)] || (isNumericLike(cityVal) ? String(cityVal) : ""));

      const provinceName =
        a?.provinceName ||
        a?.province_name ||
        provinceMap[String(provVal)] ||
        (isNumericLike(provVal) ? String(provVal) : "");

      const fallbackArea = areaName && !cityName && !provinceName ? areaName : "";
      return {
        ...a,
        _cityName: cityName || fallbackArea,
        _provinceName: provinceName,
      };
    });
  }, [list, cityMap, provinceMap]);

  if (loading) return <div>Loading addresses…</div>;
  if (err) return <div className="text-red-500">{err}</div>;
  if (!displayList.length) return <div className="text-neutral-500">Belum ada alamat.</div>;

  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
      {displayList.map((a) => (
        <AddressCard
          key={a.id}
          id={a.id}
          benchmark={a.benchmark || ""}   // jangan ada fallback "benchmark"
          label={a.picLabel || ""}
          line={a.address || ""}

          city={a._cityName || ""}
          province={a._provinceName || ""}

          postalCode={a.postalCode || a.postal_code || ""}
          name={a.picName || "receiver"}
          phone={a.phone || a.picPhone || a.pic_phone || (a.pic && a.pic.phone) || ""}

          selected={a.id === selectedId}
          disabled={saving}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
