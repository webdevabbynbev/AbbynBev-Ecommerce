"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import * as FaIcons from "react-icons/fa";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";

import {
  BtnIcon,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SearchBar,
} from "@/components";

import CartButton from "@/components/button/cartButton";
import ShopByCategoryDropdown from "./categoryDropdown";
import MegaDropdown from "./megaDropdown";

/* ===================== DROPDOWN DATA ===================== */
export const shopByConcern = [
  {
    label: "Acne",
    children: [
      {
        label: "Oily Skin",
        children: [{ label: "Acne Cleanser", href: "/concern/acne-cleanser" }],
      },
    ],
  },
];

export const shopByBrand = [
  {
    label: "Local Brand",
    children: [
      {
        label: "Skincare",
        children: [
          { label: "Somethinc", href: "/brand/somethinc" },
          { label: "Avoskin", href: "/brand/avoskin" },
        ],
      },
    ],
  },
];

export function NavbarLoggedIn({
  pathname,
  user,
  links,
  linksidebar,
  isNavActive,
  search,
  setSearch,
  onSearch,
  open,
  setOpen,
  onLogout,
}) {
  const router = useRouter();

  // category dari DB
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // fetch category dari DB
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCatLoading(true);

        const res = await axios.get("/category-types");

        // ✅ fleksibel: support beberapa bentuk response
        const raw = res?.data;
        const arr = Array.isArray(raw?.serve)
          ? raw.serve
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];

        if (alive) setCategoryTypes(arr);
      } catch (err) {
        console.error("Failed to load category-types:", err);
        if (alive) setCategoryTypes([]);
      } finally {
        if (alive) setCatLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* ===================== MOBILE ( < lg ) ===================== */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex-1 min-w-0">
          <SearchBar
            className="w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={onSearch}
          />
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <CartButton />
          <BtnIcon
            iconName="Bell"
            variant="tertiary"
            size="sm"
            onClick={() => router.push("/notification")}
          />
        </div>
      </div>

      {/* ===================== DESKTOP ( >= lg ) ===================== */}
      <div className="hidden lg:flex items-center justify-between gap-6">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/Logoabby-text.svg" alt="Logo" width={160} height={80} />
          </div>

          {/* STATIC LINKS */}
          {links.map((link) => {
            const isExternal =
              typeof link.href === "string" && link.href.startsWith("http");
            const active = isNavActive(link.href);

            const className = clsx(
              "whitespace-nowrap text-sm font-medium transition-colors",
              active ? "text-primary-700" : "text-gray-700 hover:text-primary-500"
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

          {/* DROPDOWN MENUS */}
          <div className="flex items-center">
            <ShopByCategoryDropdown
              label="Shop By Category"
              categories={categoryTypes}
              loading={catLoading}
            />

            <MegaDropdown label="Shop by Concern" items={shopByConcern} />
            <MegaDropdown label="Shop by Brand" items={shopByBrand} />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <SearchBar
            className="max-w-75"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={onSearch}
          />

          <CartButton />

          <Link href="/notification">
            <BtnIcon as="span" iconName="Bell" variant="tertiary" size="sm" />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <BtnIcon as="span" iconName="User" variant="tertiary" size="sm" />
            </SheetTrigger>

            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img
                    src="/Logoabby-text.svg"
                    alt="abbynbev"
                    className="w-37.5 h-auto"
                  />
                </SheetTitle>
                <SheetDescription className="py-1">Account menu</SheetDescription>
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
                      {Icon && <Icon className="font-bold w-3.5 h-3.5 shrink-0" />}
                    </Link>
                  );
                })}

                <div className="pt-4">
                  <Button
                    onClick={onLogout}
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
      </div>
    </>
  );
}
