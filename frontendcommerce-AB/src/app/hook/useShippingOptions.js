"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ssGet, ssSet } from "@/utils/storage";
import { fetchShippingCost } from "@/services/checkout/shipping";
import { groupByCourier, normalizeShipping, pickCheapestBest } from "@/services/checkout/shippingAdapter";

export function useShippingOptions({ selectedAddress, selectedAddressId, weightRounded, enabled }) {
  const [shippingAll, setShippingAll] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [expandedCouriers, setExpandedCouriers] = useState({});
  const [loadingShip, setLoadingShip] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  const lastKeyRef = useRef("");
  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!selectedAddressId) return;

      const key = `ship:${selectedAddressId}|${weightRounded}`;

      const cached = ssGet(key);
      if (cached) {
        try {
          const payload = JSON.parse(cached);
          const normalized = normalizeShipping(payload);
          setShippingAll(normalized);

          const { best } = groupByCourier(normalized);
          const cheapestBest = pickCheapestBest(best);

          setSelectedShipping((prev) => {
            if (!normalized.length) return null;
            if (!prev) return cheapestBest || normalized[0];
            return normalized.find((x) => x.id === prev.id) || cheapestBest || normalized[0];
          });

          setShippingError(null);
          return;
        } catch {}
      }

      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      const reqId = ++reqIdRef.current;
      setLoadingShip(true);
      setShippingError(null);

      try {
        const payload = await fetchShippingCost({
          addressId: selectedAddressId,
          weight: weightRounded,
          courier: "all",
        });

        if (reqId !== reqIdRef.current) return;

        ssSet(key, JSON.stringify(payload));

        const normalized = normalizeShipping(payload);
        setShippingAll(normalized);

        const { best } = groupByCourier(normalized);
        const cheapestBest = pickCheapestBest(best);

        setSelectedShipping((prev) => {
          if (!normalized.length) return null;
          if (!prev) return cheapestBest || normalized[0];
          return normalized.find((x) => x.id === prev.id) || cheapestBest || normalized[0];
        });

        setShippingError(null);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.meta?.message ||
          err?.message ||
          "Shipping error";

        setShippingAll([]);
        setSelectedShipping(null);
        setShippingError(`[${err?.response?.status || 500}] ${msg}`);
        lastKeyRef.current = "";
      } finally {
        setLoadingShip(false);
      }
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, selectedAddressId, weightRounded]);

  const { shippingGroups, bestByCourier, courierKeys } = useMemo(() => {
    const { groups, best } = groupByCourier(shippingAll);
    return { shippingGroups: groups, bestByCourier: best, courierKeys: Object.keys(groups).sort() };
  }, [shippingAll]);

  return {
    shippingAll,
    selectedShipping,
    setSelectedShipping,
    expandedCouriers,
    setExpandedCouriers,
    loadingShip,
    shippingError,
    shippingGroups,
    bestByCourier,
    courierKeys,
  };
}
