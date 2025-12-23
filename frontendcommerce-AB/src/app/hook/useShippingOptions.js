"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ssGet, ssSet } from "@/utils/storage";
import { fetchShippingCost } from "@/services/checkout/shipping";
import {
  groupByCourier,
  normalizeShipping,
  pickCheapestBest,
} from "@/services/checkout/shippingAdapter";

function unwrapPricing(payload) {
  // Support: payload array (langsung pricing) atau payload object { serve, message, meta }
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.serve)) return payload.serve;
  return [];
}

function extractErrorMessage(err) {
  const data = err?.response?.data;
  const serve = data?.serve;

  const serveMsg =
    (typeof serve === "string" ? serve : null) ||
    serve?.error?.message ||
    (typeof serve?.error === "string" ? serve.error : null) ||
    serve?.message ||
    (Array.isArray(serve?.errors) ? serve.errors.join(", ") : null);

  const code =
    data?.meta?.biteship?.code ||
    serve?.error?.code ||
    data?.code ||
    null;

  const msg =
    data?.message ||
    serveMsg ||
    err?.message ||
    "Shipping error";

  return code ? `${msg} (code: ${code})` : msg;
}

export function useShippingOptions({
  selectedAddress,
  selectedAddressId,
  weightRounded,
  enabled,
}) {
  const [shippingAll, setShippingAll] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [expandedCouriers, setExpandedCouriers] = useState({});
  const [loadingShip, setLoadingShip] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  const lastKeyRef = useRef("");
  const timerRef = useRef(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    // kalau disable, reset state biar UI gak nyangkut
    if (!enabled) {
      setShippingAll([]);
      setSelectedShipping(null);
      setShippingError(null);
      setLoadingShip(false);
      lastKeyRef.current = "";
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!selectedAddressId) return;

      const key = `ship:${selectedAddressId}|${weightRounded}`;

      const cached = ssGet(key);
      if (cached) {
        try {
          const cachedPayload = JSON.parse(cached);
          const pricing = unwrapPricing(cachedPayload);

          const normalized = normalizeShipping(pricing);
          setShippingAll(normalized);

          const { best } = groupByCourier(normalized);
          const cheapestBest = pickCheapestBest(best);

          setSelectedShipping((prev) => {
            if (!normalized.length) return null;
            if (!prev) return cheapestBest || normalized[0];
            return (
              normalized.find((x) => x.id === prev.id) ||
              cheapestBest ||
              normalized[0]
            );
          });

          setShippingError(null);
          return;
        } catch {
          // ignore cache parse error
        }
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
          // buat debug cepat kalau "all" bikin 400, ganti sementara: "jne,sicepat"
          courier: "all",
        });

        if (reqId !== reqIdRef.current) return;

        // simpan payload apa adanya (biar kalau bentuknya object tetap aman)
        ssSet(key, JSON.stringify(payload));

        const pricing = unwrapPricing(payload);
        const normalized = normalizeShipping(pricing);

        setShippingAll(normalized);

        const { best } = groupByCourier(normalized);
        const cheapestBest = pickCheapestBest(best);

        setSelectedShipping((prev) => {
          if (!normalized.length) return null;
          if (!prev) return cheapestBest || normalized[0];
          return (
            normalized.find((x) => x.id === prev.id) ||
            cheapestBest ||
            normalized[0]
          );
        });

        setShippingError(null);
      } catch (err) {
        const msg = extractErrorMessage(err);

        setShippingAll([]);
        setSelectedShipping(null);
        setShippingError(`[${err?.response?.status || 500}] ${msg}`);
        lastKeyRef.current = "";
      } finally {
        if (reqId === reqIdRef.current) setLoadingShip(false);
      }
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, selectedAddressId, weightRounded]);

  const { shippingGroups, bestByCourier, courierKeys } = useMemo(() => {
    const { groups, best } = groupByCourier(shippingAll);
    return {
      shippingGroups: groups,
      bestByCourier: best,
      courierKeys: Object.keys(groups).sort(),
    };
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
