"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Profilepage } from "./profile";

export default function AccountTabs({ slug }) {
  const router = useRouter();
  const pathname = usePathname();

  // Tabs yang tetap di dalam halaman account
  const INTERNAL_TABS = [
    { value: "profile", label: "Profile" },
    { value: "wishlist", label: "Wishlist" },
  ];

  return (
    <Tabs
      key={slug}
      value={slug}
      onValueChange={(val) => router.push(`/account/${val}`)}
      className="flex md:flex-row sm:flex-col gap-4 w-full"
    >
      {/* SIDEBAR */}
      <TabsList
        className="flex md:flex-col sm:flex-row h-fit w-[200px] 
        items-center justify-between rounded-lg border p-2 space-y-2"
      >
        {/* Profile Tab */}
        <TabsTrigger value="profile" className="w-full justify-start">
          Profile
        </TabsTrigger>

        {/* My Order — buka halaman terpisah */}
        <button
          className={`
            w-full text-left px-3 py-2 rounded-md text-sm
            ${pathname.includes("order-history")
              ? "bg-pink-600 text-white"
              : "hover:bg-gray-100 text-gray-700"
            }
          `}
          onClick={() => router.push("/account/order-history")}
        >
          My Order
        </button>

        {/* Wishlist Tab */}
        <TabsTrigger value="wishlist" className="w-full justify-start">
          Wishlist
        </TabsTrigger>
      </TabsList>

      {/* CONTENT AREA */}
      <div className="flex-1 h-auto w-full">
        <TabsContent value="profile">
          <Profilepage />
        </TabsContent>

        <TabsContent value="wishlist">
          Halaman Wishlist
        </TabsContent>
      </div>
    </Tabs>
  );
}
