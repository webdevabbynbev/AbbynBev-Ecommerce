"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  BtnIcon,
  Button,
  TxtField,
  LoginRegisModalForm,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
    { icon: "FaBox", href: "/account/order-history", label: "My order" },
    { icon: "FaRegHeart", href: "/account/wishlist", label: "Wishlist" },
  ];

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/best-seller", label: "Best seller" },
    { href: "/sale", label: "Sale" },
    { href: "/new-arrival", label: "New arrival" },
    { href: "/beauty-and-tips", label: "Beauty & tips" },
  ];

  const isNavActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="Navbar flex h-auto px-10 py-5 sticky top-0 w-full bg-white border-b-[1px] border-primary-700 transition-all justify-between items-center z-50">
      <div className="content-wrapper flex justify-between w-full max-w-[1536px] mx-auto">
        {/* LEFT SIDE */}
        <div className="content-left flex w-auto items-center justify-center space-x-6">
          <div className="Icon-wrapper h-auto w-auto flex justify-center space-x-3">
            <Image
              src="/logo-abby-circle.svg"
              alt="Logo-circle"
              height={45}
              width={45}
              className="justify-center"
            />
            <Image
              src="/Logoabby-text.svg"
              alt="Logo"
              height={0}
              width={0}
              className="w-[150px] h-auto justify-center"
            />
          </div>

          <div className="w-auto justify-center">
            <TxtField
              placeholder="Wardah, Maybeline, anything. . ."
              iconLeftName="MagnifyingGlass"
              variant="outline"
              size="md"
              className="min-w-[280px]"
            />
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "items-center transition-colors text-sm",
                isNavActive(link.href)
                  ? "text-primary-700"
                  : "hover:text-primary-500"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* RIGHT SIDE */}
        {user ? (
          <div className="flex justify-end items-center gap-3">
            <CartButton />
            <BtnIcon iconName="Bell" variant="tertiary" size="sm" />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <BtnIcon iconName="User" variant="tertiary" size="sm" />
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img
                      src="/Logoabby-text.svg"
                      alt="abbynbev"
                      className="w-[150px] h-auto"
                    />
                  </SheetTitle>
                  <SheetDescription className="py-1">
                    Account menu
                  </SheetDescription>
                </SheetHeader>

                <nav className="py-4 space-y-1">
                  {linksidebar.map((linkside) => {
                    const Icon = FaIcons[linkside.icon];
                    const isActive =
                      pathname === linkside.href ||
                      (linkside.href === "/account/order-history" &&
                        pathname.startsWith("/account/order-history"));

                    return (
                      <Link
                        key={linkside.href}
                        href={linkside.href}
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "rounded-md px-4 py-2 items-center transition-colors flex justify-between",
                          isActive
                            ? "text-neutral-950 bg-neutral-100"
                            : "hover:bg-neutral-100 transition-all duration-300"
                        )}
                      >
                        <span>{linkside.label}</span>
                        {Icon && (
                          <Icon className="font-bold w-3.5 h-3.5 shrink-0" />
                        )}
                      </Link>
                    );
                  })}

                  <div className="pt-4">
                    <Button
                      onClick={handleLogout}
                      variant="tertiary"
                      size="sm"
                      className="w-full"
                    >
                      Sign out
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div>
            <LoginRegisModalForm />
          </div>
        )}
      </div>
    </nav>
  );
}
