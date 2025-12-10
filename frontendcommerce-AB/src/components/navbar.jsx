"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { BtnIcon, Button, TxtField, LoginRegisModalForm,
  Sheet, SheetContent, SheetDescription, SheetHeader,
  SheetTitle, SheetTrigger,
} from ".";
import { usePathname, useRouter } from "next/navigation";
import * as FaIcons from "react-icons/fa";
import CartButton from "@/components/CartButton"; 
import clsx from "clsx";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const linksidebar = [
    { icon: "FaRegUser", href: "/account/profile", label: "Profile" },
    { icon: "FaBox", href: "/account/my-order", label: "My order" },
    { icon: "FaRegHeart", href: "/account/wishlist", label: "Wishlist" },
  ];

  const links = [
    { href: "/", label: "Home" },
    { href: "/", label: "Best seller" },
    { href: "/", label: "Brand" },
    { href: "/sale", label: "Sale" },
    { href: "/new-arrival", label: "New arrival" },
    { href: "/beauty-and-tips", label: "Beauty and Tips" },
    { href: "/abeauties", label: "ABeauties" },
  ];

  return (
    <nav className="w-full sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-abby-circle.svg"
              width={40}
              height={40}
              alt="logo"
            />
            <Image
              src="/Logoabby-text.svg"
              width={130}
              height={40}
              alt="logo-text"
            />
          </div>

          {/* Search bar */}
          <div className="w-[280px]">
            <TxtField
              placeholder="Search here..."
              iconLeftName="MagnifyingGlass"
              variant="outline"
              size="md"
              className="w-full"
            />
          </div>
        </div>

        {/* CENTER NAV LINKS */}
        <div className="hidden lg:flex items-center gap-5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm transition",
                  isActive ? "text-pink-600 font-semibold" : "text-gray-700 hover:text-pink-500"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">

          {/* CART ICON */}
          <CartButton />

          {/* IF USER LOGIN */}
          {user ? (
            <>
              <BtnIcon iconName="Bell" variant="tertiary" size="sm" />

              <Sheet open={open} onOpenChange={() => setOpen(!open)}>
                <SheetTrigger asChild>
                  <BtnIcon iconName="User" variant="tertiary" size="sm" />
                </SheetTrigger>

                <SheetContent>
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <img
                        src="/Logoabby-text.svg"
                        alt="abbynbev"
                        className="w-[130px] h-auto"
                      />
                    </SheetTitle>
                    <SheetDescription>Account menu</SheetDescription>
                  </SheetHeader>

                  <nav className="py-4 space-y-1">
                    {linksidebar.map((item) => {
                      const Icon = FaIcons[item.icon];
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex justify-between px-4 py-2 rounded-md hover:bg-gray-100"
                        >
                          <span>{item.label}</span>
                          <Icon />
                        </Link>
                      );
                    })}

                    <Button
                      onClick={handleLogout}
                      variant="tertiary"
                      size="sm"
                      className="mt-4"
                    >
                      Sign out
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <LoginRegisModalForm />
          )}
        </div>
      </div>
    </nav>
  );
}
