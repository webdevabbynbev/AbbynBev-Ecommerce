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
import clsx from "clsx";
import CartButton from "./CartButton";

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
    { href: "/best-seller", label: "Best seller" },
    { href: "/sale", label: "Sale" },
    { href: "/new-arrival", label: "New arrival" },
    { href: "https://abbynbev.com/blog/", label: "Beauty & tips" },
  ];

  const isNavActive = (href) => {
    if (href.startsWith("http")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // --- shared searchbar ---
  const SearchBar = ({ className = "" }) => (
    <TxtField
      placeholder="Cari disini . . ."
      iconLeftName="MagnifyingGlass"
      variant="outline"
      size="md"
      className={className}
    />
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-primary-700">
      <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 py-4">
        {/* ===================== MOBILE ( < lg ) ===================== */}
        <div className="flex items-center gap-3 lg:hidden">
          {/* Searchbar full */}
          <div className="flex-1 min-w-0">
            <SearchBar className="w-full" />
          </div>

          {/* Hanya Sign in (atau user icon jika sudah login) */}
          <div className="shrink-0">
            {user ? (
              <>
              <Link href="/cart">
                <BtnIcon iconName="CartShopping" variant="tertiary" size="sm" />
              </Link>
              <Link href="/notification">
                <BtnIcon iconName="Bell" variant="tertiary" size="sm" />
              </Link>
              </>
            ) : (
              <LoginRegisModalForm />
            )}
          </div>
        </div>

        {/* ===================== DESKTOP ( >= lg ) ===================== */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/Logoabby-text.svg"
                alt="Logo"
                width={160}
                height={80}
              />
              <SearchBar className="max-w-[300px]" />
            </div>

            

            {links.map((link) => {
              const isExternal = link.href.startsWith("http");
              const active = isNavActive(link.href);
              const className = clsx(
                "text-sm items-center transition-colors",
                active ? "text-primary-700" : "hover:text-primary-500"
              );

              if (isExternal) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={className}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <Link key={link.href} href={link.href} className={className}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* RIGHT SIDE */}
          {user ? (
            <div className="flex items-center gap-3">
              <CartButton />

              <Link href="/notification">
                <BtnIcon iconName="Bell" variant="tertiary" size="sm" />
              </Link>

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
                            "rounded-md px-4 py-2 flex items-center justify-between transition-colors",
                            isActive
                              ? "text-neutral-950 bg-neutral-100"
                              : "hover:bg-neutral-100"
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
            <LoginRegisModalForm />
          )}
        </div>
      </div>
    </nav>
  );
}