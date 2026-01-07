"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { LoginRegisModalForm, SearchBar } from "@/components";

export function NavbarGuest({
  pathname,
  links,
  isNavActive,
  search,
  setSearch,
  onSearch,
}) {
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

        <div className="shrink-0">
          <LoginRegisModalForm />
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
        <div className="flex items-center gap-3">
          <SearchBar
            className="max-w-75"
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
