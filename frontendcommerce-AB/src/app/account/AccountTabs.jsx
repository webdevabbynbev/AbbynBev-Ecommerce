"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components";
import { Profilepage } from "./profile";

export default function AccountTabs({ slug }) {
  const router = useRouter();
  const pathname = usePathname();

  const activeSlug = pathname.includes("order-history") ? null : slug;

  const isOrder = pathname.includes("/account/order-history");
  const isVouchers = pathname.startsWith("/vouchers");

  return (
    <Tabs
      key={activeSlug}
      value={activeSlug || undefined}
      onValueChange={(val) => router.push(`/account/${val}`)}
      className="flex md:flex-row sm:flex-col gap-6 w-full"
    >
      {/* SIDEBAR */}
      <TabsList
        className="
          flex flex-row lg:flex-col
          h-fit w-[220px]
          items-start
          rounded-xl border p-4 space-y-2
          bg-white shadow-sm
        "
      >
        {/* ========== PROFILE ========== */}
        <TabsTrigger value="profile" className="w-full justify-start text-left">
          Profile
        </TabsTrigger>

        {/* ========== MY ORDER (Halaman terpisah) ========== */}
        <button
          onClick={() => router.push("/account/order-history")}
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm transition
            ${
              isOrder
                ? "bg-pink-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          My Order
        </button>

        {/* ========== VOUCHER (Halaman terpisah) ========== */}
        <button
          onClick={() => router.push("/vouchers")}
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm transition
            ${
              isVouchers
                ? "bg-pink-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          Voucher
        </button>

        {/* ========== WISHLIST ========== */}
        <TabsTrigger value="wishlist" className="w-full justify-start text-left">
          Wishlist
        </TabsTrigger>
      </TabsList>

      {/* CONTENT */}
      <div className="flex-1 h-auto w-full">
        <TabsContent value="profile">
          <Profilepage />
        </TabsContent>

        <TabsContent value="wishlist">Halaman Wishlist</TabsContent>

        {/* Order history & voucher tidak dirender di sini — halaman terpisah */}
      </div>
    </Tabs>
  );
}
