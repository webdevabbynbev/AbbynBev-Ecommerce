"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCart } from "@/services/checkout/cart";

export function useCheckoutCart(selectedIds) {
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  async function reloadCart() {
    setLoadingCart(true);
    try {
      const items = await fetchCart();
      setCart(items);
    } finally {
      setLoadingCart(false);
    }
  }

  useEffect(() => {
    reloadCart();
  }, []);

  const checkoutItems = useMemo(() => {
    const s = new Set(selectedIds || []);
    return (cart || []).filter((it) => s.has(it?.id));
  }, [cart, selectedIds]);

  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, it) => sum + (Number(it?.amount) || 0), 0),
    [checkoutItems]
  );

  return { cart, checkoutItems, subtotal, loadingCart, reloadCart };
}
