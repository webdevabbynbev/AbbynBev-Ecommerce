"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { getAddressByQuery, getUser } from "@/utils/auth";
import { AddressCard } from ".";

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

  // maps id -> name
  const [provinceMap, setProvinceMap] = useState({});
  const [cityMap, setCityMap] = useState({});

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

        // set pilihan awal (yang isActive === 2) kalau ada, kalau tidak pilih item pertama
        const main = data.find((x) => Number(x.isActive) === 2);
        setSelectedId(main ? main.id : data[0]?.id ?? null);

        // setelah ada list, hydrate nama lokasi
        hydrateLocationNames(data);
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

  // ---- hydrate province/city names so UI doesn't show numeric IDs
  const hydrateLocationNames = async (data) => {
    try {
      // ambil semua provinceId yang numeric
      const provinceIds = Array.from(
        new Set(
          data
            .map((a) => a?.province)
            .filter((p) => isNumericLike(p))
            .map((p) => Number(p))
        )
      );

      // 1) provinces map
      const provRes = await api.get("/province"); // /api/v1/province
      const provList = provRes.data?.serve || provRes.data?.data || [];
      const provMapNext = {};
      (Array.isArray(provList) ? provList : []).forEach((p) => {
        provMapNext[String(p.id)] = p.name;
      });
      setProvinceMap(provMapNext);

      // 2) cities map per province
      // city list harus query per provinceId (karena endpoint kamu /city?province=ID)
      const cityMapNext = {};
      await Promise.all(
        provinceIds.map(async (pid) => {
          const res = await api.get("/city", { params: { province: pid } });
          const cityList = res.data?.serve || res.data?.data || [];
          (Array.isArray(cityList) ? cityList : []).forEach((c) => {
            cityMapNext[String(c.id)] = c.name;
          });
        })
      );
      setCityMap(cityMapNext);
    } catch (e) {
      // kalau gagal mapping, UI tetap jalan (cuma tampil ID)
      console.warn("Hydrate location names failed:", e?.response?.data || e);
    }
  };

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

      const cityName =
        a?.cityName ||
        a?.city_name ||
        (typeof cityVal === "string" && !isNumericLike(cityVal) ? cityVal : cityMap[String(cityVal)] || (isNumericLike(cityVal) ? String(cityVal) : ""));

      const provinceName =
        a?.provinceName ||
        a?.province_name ||
        provinceMap[String(provVal)] ||
        (isNumericLike(provVal) ? String(provVal) : "");

      return { ...a, _cityName: cityName, _provinceName: provinceName };
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

          // ✅ tampilkan nama, bukan ID
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
