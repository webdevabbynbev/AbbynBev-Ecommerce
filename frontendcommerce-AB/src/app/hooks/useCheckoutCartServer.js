"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCart } from "@/services/checkout/cart";

export function useCheckoutCartServer() {
  const router = useRouter();

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  async function reloadCart() {
    setLoadingCart(true);
    try {
      // is_checkout=2 => items selected for checkout
      const items = await fetchCart({ isCheckout: 2 });
      setCheckoutItems(items);

      if (!items || items.length === 0) {
        router.replace("/cart");
      }
    } finally {
      setLoadingCart(false);
    }
  }

  useEffect(() => {
    reloadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = useMemo(
    () => (checkoutItems || []).reduce((sum, it) => sum + (Number(it?.amount) || 0), 0),
    [checkoutItems]
  );

  return { checkoutItems, subtotal, loadingCart, reloadCart };
}
