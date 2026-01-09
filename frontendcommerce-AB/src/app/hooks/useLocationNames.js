"use client";

import { useEffect, useState } from "react";

/**
 * Biteship migration:
 * - RajaOngkir: province & city di-hydrate lewat endpoint /province & /city
 * - Biteship: kita sudah punya biteship_area_name / biteshipAreaName di address (atau bisa parse)
 *
 * Output tetap sama: { provinceMap, cityMap }
 * supaya komponen yang sudah ada tidak perlu banyak diubah.
 */
export function useLocationNames(addresses) {
  const [provinceMap, setProvinceMap] = useState({});
  const [cityMap, setCityMap] = useState({});

  useEffect(() => {
    const provMap = {};
    const cMap = {};

    const list = Array.isArray(addresses) ? addresses : [];

    for (const a of list) {
      // coba ambil field biteship area name dari berbagai kemungkinan penamaan
      const areaName =
        a?.biteshipAreaName ||
        a?.biteship_area_name ||
        a?.areaName ||
        a?.area_name ||
        "";

      // kalau backend kamu sudah simpan province/city name terpisah, pakai itu
      const provinceName =
        a?.provinceName ||
        a?.province_name ||
        parseProvinceFromAreaName(areaName) ||
        (typeof a?.province === "string" ? a.province : "");

      const cityName =
        a?.cityName ||
        a?.city_name ||
        parseCityFromAreaName(areaName) ||
        (typeof a?.city === "string" ? a.city : "");

      // key untuk mapping: tetap pakai value "province" / "city" yang dipakai komponen sekarang
      const provKey = a?.province != null ? String(a.province) : "";
      const cityKey = a?.city != null ? String(a.city) : "";

      if (provKey && provinceName) provMap[provKey] = provinceName;
      if (cityKey && cityName) cMap[cityKey] = cityName;
    }

    setProvinceMap(provMap);
    setCityMap(cMap);
  }, [addresses]);

  return { provinceMap, cityMap };
}

function parseProvinceFromAreaName(areaName) {
  const parts = splitAreaName(areaName);
  // biasanya format: "Kecamatan, Kota/Kab, Provinsi" atau "Kelurahan, Kecamatan, Kota, Provinsi"
  // provinsi umumnya elemen terakhir
  return parts.length >= 1 ? parts[parts.length - 1] : "";
}

function parseCityFromAreaName(areaName) {
  const parts = splitAreaName(areaName);
  // city/kab biasanya elemen kedua terakhir
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

function splitAreaName(areaName) {
  if (!areaName) return [];
  return String(areaName)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
