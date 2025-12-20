"use client";

import { useEffect, useState } from "react";
import { fetchCities, fetchProvinces } from "@/services/checkout/address";
import { isNumericLike } from "@/utils/number";

export function useLocationNames(addresses) {
  const [provinceMap, setProvinceMap] = useState({});
  const [cityMap, setCityMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const provinces = await fetchProvinces();
        const provMap = {};
        provinces.forEach((p) => (provMap[String(p.id)] = p.name));
        if (!cancelled) setProvinceMap(provMap);

        const provinceIds = Array.from(
          new Set(
            (addresses || [])
              .map((a) => a?.province)
              .filter((p) => isNumericLike(p))
              .map((p) => Number(p))
          )
        );

        const nextCityMap = {};
        await Promise.all(
          provinceIds.map(async (pid) => {
            const cities = await fetchCities(pid);
            cities.forEach((c) => (nextCityMap[String(c.id)] = c.name));
          })
        );

        if (!cancelled) setCityMap(nextCityMap);
      } catch (e) {
        console.warn("Hydrate location names failed:", e?.response?.data || e);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [addresses]);

  return { provinceMap, cityMap };
}
