"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BtnIcon,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components";

export function MobileBottomNav({ className = "" }) {
  const pathname = usePathname();
  const [shopOpen, setShopOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathnameSafe = mounted ? pathname : "";
  const singleSegmentRoutes = new Set([
    "/",
    "/best-seller",
    "/sale",
    "/new-arrival",
    "/notification",
    "/search",
    "/sign-in",
    "/beauty-and-tips",
    "/checkout",
    "/ramadan-checkin",
  ]);
  const isSingleSegment =
    pathnameSafe && pathnameSafe !== "/" && /^\/[^/]+$/.test(pathnameSafe);
  const isProductDetailRoute =
    isSingleSegment && !singleSegmentRoutes.has(pathnameSafe);
  const hiddenRoutes = new Set(["/cart"]);
  const shouldHideNav = isProductDetailRoute || hiddenRoutes.has(pathnameSafe);

  useEffect(() => setMounted(true), []);

  const isActive = (href) => {
    if (!href || href.startsWith("http")) return false;
    if (!mounted) return false; // ✅ hindari mismatch SSR vs client
    if (href === "/") return pathnameSafe === "/";
    return pathnameSafe === href || pathnameSafe.startsWith(href + "/");
  };

  const navItemBase =
    "flex flex-col items-center justify-center gap-1 py-1 w-full";
  const pillBase = "rounded-xl px-1 py-1 transition-colors";

  const shopLinks = [
    { href: "/sale", label: "Sale" },
    { href: "/best-seller", label: "Best Seller" },
    { href: "/new-arrival", label: "New Arrival" },
  ];

  const shopActive = mounted && shopLinks.some((l) => isActive(l.href));

  if (shouldHideNav) {
    return null;
  }

  return (
    <div
      className={clsx(
        "lg:hidden fixed inset-x-0 bottom-0 z-50",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto w-full  max-w-[520px] px-4 pb-4">
        <div className="rounded-2xl border border-primary-500 bg-white">
          <nav className="grid grid-cols-4 items-center px-2 py-2">
            {/* PROFILE */}
            <Link
              href="/account/profile"
              aria-label="Profile"
              className={navItemBase}
            >
              <div
                className={clsx(
                  pillBase,
                  isActive("/account/profile") ? "bg-primary-100" : null
                )}
              >
                <BtnIcon iconName="User" variant="tertiary" size="sm" />
              </div>
              <span
                className={clsx(
                  "text-[10px] leading-none",
                  isActive("/account/profile")
                    ? "text-primary-700 font-bold"
                    : "text-primary-700 font-normal"
                )}
              >
                Profile
              </span>
            </Link>

            {/* HOME */}
            <Link href="/" aria-label="Home" className={navItemBase}>
              <div
                className={clsx(
                  pillBase,
                  isActive("/") ? "bg-primary-100" : "hover:bg-primary-50"
                )}
              >
                <BtnIcon iconName="House" variant="tertiary" size="sm" />
              </div>
              <span
                className={clsx(
                  "text-[10px] leading-none",
                  isActive("/")
                    ? "text-primary-700 font-bold"
                    : "text-primary-700 font-normal"
                )}
              >
                Home
              </span>
            </Link>

            {/* BLOG (external) */}
            <a
              href="https://abbynbev.com/blog/"
              target="_blank"
              rel="noreferrer"
              aria-label="Blog"
              className={navItemBase}
            >
              <div className={clsx(pillBase, "hover:bg-primary-50")}>
                <BtnIcon iconName="Newspaper" variant="tertiary" size="sm" />
              </div>
              <span className="text-[10px] leading-none text-primary-700 font-normal">
                Blog
              </span>
            </a>

            {/* SHOP (opens sheet) */}
            <Sheet open={shopOpen} onOpenChange={setShopOpen}>
              <SheetTrigger asChild>
                <button type="button" aria-label="Shop" className={navItemBase}>
                  <div
                    className={clsx(
                      pillBase,
                      shopActive ? "bg-primary-100" : null
                    )}
                  >
                    <BtnIcon
                      as="span"
                      iconName="Shop"
                      variant="tertiary"
                      size="sm"
                    />
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] leading-none",
                      shopActive
                        ? "text-primary-700 font-bold"
                        : "text-primary-700 font-normal"
                    )}
                  >
                    Shop
                  </span>
                </button>
              </SheetTrigger>

              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="text-primary-700">Shop</SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-2">
                  {shopLinks.map((l) => {
                    const active = isActive(l.href);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setShopOpen(false)}
                        className={clsx(
                          "block rounded-xl px-4 py-3 font-medium transition-colors",
                          active
                            ? "bg-primary-100 text-primary-700"
                            : "hover:bg-primary-50"
                        )}
                      >
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </div>
    </div>
  );
}
