"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import axios from "@/lib/axios";
import { LoginRegisModalForm, SearchBar } from "@/components";
import MegaDropdown from "./megaDropdown";
import { useEffect, useState } from "react";
import ShopByCategoryDropdown from "./categoryDropdown";

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

/* ===================== COMPONENT ===================== */
export function NavbarGuest({
  links = [],
  isNavActive = () => false,
  search,
  setSearch,
  onSearch,
}) {
  // category dari DB
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // fetch category dari DB
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCatLoading(true);

        // pastikan baseURL axios kamu sudah benar (atau ganti ke instance axios internal)
        const res = await axios.get("/category-types");

        const arr = Array.isArray(res?.data?.serve) ? res.data.serve : [];
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
      {/* ===================== MOBILE (< lg) ===================== */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <SearchBar
            className="w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={onSearch}
          />
        </div>

        <div className="shrink-0">
          <LoginRegisModalForm />
        </div>
      </div>

      {/* ===================== DESKTOP (>= lg) ===================== */}
      <div className="hidden items-center justify-between gap-6 lg:flex">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-5">
          {/* LOGO */}
          <Link href="/" className="shrink-0">
            <Image
              src="/Logoabby-text.svg"
              alt="Abby n Bev"
              width={160}
              height={80}
              priority
            />
          </Link>

          {/* STATIC LINKS */}
          {links.map((link) => {
            const isExternal = typeof link.href === "string" && link.href.startsWith("http");
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
              loading={catLoading} // opsional kalau component kamu handle state loading
            />

            <MegaDropdown label="Shop by Concern" items={shopByConcern} />
            <MegaDropdown label="Shop by Brand" items={shopByBrand} />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <SearchBar
            className="max-w-[320px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={onSearch}
          />
          <LoginRegisModalForm />
        </div>
      </div>
    </>
  );
}
