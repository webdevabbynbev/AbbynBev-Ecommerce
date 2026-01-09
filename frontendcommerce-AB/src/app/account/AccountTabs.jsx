"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components";
import { Profilepage } from "./profile";

export default function AccountTabs({ slug }) {
  const router = useRouter();
  const pathname = usePathname();

  const INTERNAL_TABS = ["profile", "wishlist"];
  const activeSlug = pathname.includes("order-history") ? null : slug;

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
        <TabsTrigger
          value="profile"
          className="w-full justify-start text-left"
        >
          Profile
        </TabsTrigger>

        {/* ========== MY ORDER (Halaman terpisah, bukan tabs) ========== */}
        <button
          onClick={() => router.push("/account/order-history")}
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm transition
            ${
              pathname.includes("order-history")
                ? "bg-pink-600 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          My Order
        </button>

        {/* ========== WISHLIST ========== */}
        <TabsTrigger
          value="wishlist"
          className="w-full justify-start text-left"
        >
          Wishlist
        </TabsTrigger>
      </TabsList>

      {/* CONTENT */}
      <div className="flex-1 h-auto w-full">
        <TabsContent value="profile">
          <Profilepage />
        </TabsContent>

        <TabsContent value="wishlist">
          Halaman Wishlist
        </TabsContent>

        {/* Order history tidak dirender di sini — dibuka di halaman terpisah */}
      </div>
    </Tabs>
  );
}
