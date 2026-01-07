"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useAuthGate } from "@/app/hooks/useAuthGate";

import { NavbarGuest, NavbarLoggedIn  } from "."

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  
  const { user, token, logout } = useAuth();
  const isAuthed = !!token || !!user;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");


  useEffect(() => {
    if (!isAuthed) setOpen(false);
  }, [isAuthed]);

  const handleLogout = async () => {
    await logout(); 
    router.replace("/");
  };

  const handleSearch = () => {
    const q = search.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/best-seller", label: "Best seller" },
    { href: "/sale", label: "Sale" },
    { href: "/new-arrival", label: "New arrival" },
    { href: "https://abbynbev.com/blog/", label: "Beauty & tips" },
  ];

  const linksidebar = [
    { icon: "FaRegUser", href: "/account/profile", label: "Profile" },
    { icon: "FaBox", href: "/account/order-history", label: "My order" },
    { icon: "FaRegHeart", href: "/account/wishlist", label: "Wishlist" },
  ];

  const isNavActive = (href) => {
    if (href.startsWith("http")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-primary-700">
      <div className="mx-auto w-full max-w-384 px-4 sm:px-6 lg:px-10 py-4">
        {isAuthed ? (
          <NavbarLoggedIn
            pathname={pathname}
            user={user}
            links={links}
            linksidebar={linksidebar}
            isNavActive={isNavActive}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            open={open}
            setOpen={setOpen}
            onLogout={handleLogout}
          />
        ) : (
          <NavbarGuest
            pathname={pathname}
            links={links}
            isNavActive={isNavActive}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
          />
        )}
      </div>
    </nav>
  );
}
