"use client";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { Profilepage } from "./profile";

export default function AccountTabs({ slug }) {
  const router = useRouter();

  const TABS = [
  { value: "profile",  label: "Profile",   href: (v) => `/account/${v}` },
  { value: "my-order", label: "My Order",  href: (v) => `/account/${v}` },
  { value: "wishlist", label: "Wishlist",  href: (v) => `/account/${v}` },
];

  return ( 
      <Tabs
        key={slug}
        value={slug}
        onValueChange={(val) => router.push(`/account/${val}`)}
        className="flex md:flex-row sm:flex-col gap-4 w-full"
      >
        <TabsList className="flex md:flex-col sm:flex-row h-fit w-[200px] items-center justify-between rounded-lg border p-2 space-y-2">
          <TabsTrigger value="profile" className="w-full justify-start">
            Profile
          </TabsTrigger>
          <TabsTrigger value="my-order" className="w-full justify-start">
            My Order
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="w-full justify-start">
            Wishlist
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 h-auto w-full">
          <TabsContent value="profile"><Profilepage/> </TabsContent>
          <TabsContent value="my-order">Halaman My Order </TabsContent>
          <TabsContent value="wishlist">Halaman Wishlist </TabsContent>
        </div>
      </Tabs>
  );
}
