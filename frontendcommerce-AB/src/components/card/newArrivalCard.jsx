"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BtnIconToggle } from "..";
import { slugify } from "@/utils";

export function NewArrivaleCard({ product }) {
  const [wishlist, setWishlist] = useState([]);

  if (!product) return null;

  const item = useMemo(() => {
    const raw = product;

    const id =
      raw.id ??
      raw._id ??
      raw.slug ??
      raw.sku ??
      raw.code ??
      raw.name ??
      raw.productName ??
      raw.title ??
      "unknown";

    const name = raw.name ?? raw.productName ?? raw.title ?? "Unnamed Product";

    const price = Number(
      raw.price ??
        raw.base_price ??
        raw.basePrice ??
        raw.salePrice ??
        (Array.isArray(raw.prices) ? raw.prices[0] : undefined) ??
        0
    );

    const compareAt = Number(
      raw.realprice ??
        raw.oldPrice ??
        (Array.isArray(raw.prices) ? raw.prices[1] : undefined) ??
        NaN
    );

    const image =
      raw.image ??
      (Array.isArray(raw.images) ? raw.images[0] : null) ??
      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

    const slugSource = raw.slug || raw.path || "";
    const safeSlug = slugSource ? String(slugSource) : slugify(String(name || ""));

    return {
      id: String(id),
      name,
      price,
      compareAt,
      image,
      rating: Number(raw.rating ?? raw.stars ?? 0),
      slug: safeSlug,
      sale: Boolean(raw.sale),
    };
  }, [product]);

  const hasSale =
    Number.isFinite(item.compareAt) && item.compareAt > item.price;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wishlist");
      if (stored) setWishlist(JSON.parse(stored));
    } catch (e) {
      console.log("Wishlist parse error:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.log("Wishlist save error:", e);
    }
  }, [wishlist]);

  const handleWishlist = () => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      return exists ? prev.filter((p) => p.id !== item.id) : [...prev, item];
    });
  };

  const isWishlisted = wishlist.some((p) => p.id === item.id);
  const href = item.slug ? `/${encodeURIComponent(item.slug)}` : "#";

  return (
    <Link href={href} className="group relative flex h-full w-full flex-col rounded-lg bg-white transition-all overflow-hidden">
      <div className="relative">
        {/* Wishlist button */}
        <div className="absolute top-4 right-4 z-10">
          <BtnIconToggle
            active={isWishlisted}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist();
            }}
            variant="tertiary"
            size="md"
          />
        </div>

        {/* Image */}
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-auto object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";
          }}
        />

        {/* Tooltip */}
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 w-max max-w-[90%] -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {item.name}
        </div>

        {/* Sale badge (optional) */}
        {(item.sale || hasSale) && (
          <div className="absolute left-3 top-3 rounded-md bg-black/80 px-2 py-1 text-xs text-white">
            Sale
          </div>
        )}
      </div>
    </Link>
  );
}