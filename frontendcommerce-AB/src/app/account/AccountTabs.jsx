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

  const navClass = (active) =>
    `
    group w-full flex items-center gap-3
    px-3 py-2 rounded-lg text-sm font-medium transition-all
    ${active
      ? "bg-primary-700 text-white shadow-md"
      : "text-gray-700 hover:bg-pink-50 hover:text-pink-600"
    }
  `;


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
          flex flex-row lg:flex-col gap-1
          h-fit w-[220px]
          items-start
          rounded-xl border p-4 space-y-1
          bg-white shadow-sm
        "
      >
        <button
          onClick={() => router.push("/account/profile")}
          className={navClass(pathname === "/account/profile")}
        >
          Profile
        </button>

        <button
          onClick={() => router.push("/account/order-history")}
          className={navClass(pathname.startsWith("/account/order-history"))}
        >
          My Order
        </button>

        <button
          onClick={() => router.push("/account/wishlist")}
          className={navClass(pathname.startsWith("/account/wishlist"))}
        >
          Wishlist
        </button>

        <button
          onClick={() => router.push("/vouchers")}
          className={navClass(pathname.startsWith("/vouchers"))}
        >
          Voucher
        </button>
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
