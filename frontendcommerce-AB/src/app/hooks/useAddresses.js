"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAddresses, setMainAddress } from "@/services/checkout/address";
import { n } from "@/utils/number";

export function useAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(true);

  async function reloadAddresses(preferId = null) {
    setLoadingAddr(true);
    try {
      const arr = await fetchAddresses();
      setAddresses(arr);

      const getIsActive = (a) => n(a?.is_active ?? a?.isActive ?? 0, 0);

      const pick =
        (preferId ? arr.find((x) => x?.id === preferId) : null) ||
        arr.find((x) => getIsActive(x) === 2) ||
        arr[0] ||
        null;

      setSelectedAddressId(pick?.id ?? null);
    } finally {
      setLoadingAddr(false);
    }
  }

  useEffect(() => {
    reloadAddresses();
  }, []);

  async function selectAsMain(id) {
    setSelectedAddressId(id);
    try {
      await setMainAddress(id);
      await reloadAddresses(id);
    } catch (err) {
      console.warn("Failed set main address:", err?.response?.data || err);
    }
  }

  const selectedAddress = useMemo(
    () => addresses.find((a) => a?.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  return { addresses, selectedAddressId, selectedAddress, loadingAddr, reloadAddresses, selectAsMain };
}
