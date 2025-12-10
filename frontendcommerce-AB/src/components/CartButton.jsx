"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";

export default function CartButton() {
  const [totalQty, setTotalQty] = useState(0);

  const loadCartCount = async () => {
    try {
      const res = await axios.get("/cart");
      const items = res.data?.data?.items || [];
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setTotalQty(count);
    } catch (err) {
      console.log("Error load cart:", err);
    }
  };

  useEffect(() => {
    loadCartCount();
  }, []);

  return (
    <Link href="/cart" className="relative inline-flex items-center">
      <FaShoppingCart size={20} className="text-primary-700" />

      {totalQty > 0 && (
        <span className="
          absolute -top-2 -right-2 
          bg-pink-600 text-white text-xs
          px-2 py-[1px] rounded-full
        ">
          {totalQty}
        </span>
      )}
    </Link>
  );
}
