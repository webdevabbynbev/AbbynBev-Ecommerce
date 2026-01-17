"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BtnIconToggle } from "..";
import { slugify, getDiscountPercent, applyExtraDiscount } from "@/utils";

export function NewArrivaleCard({ product }) {
  const [wishlist, setWishlist] = useState([]);

  if (!product) return null;

  const item = useMemo(() => {
    const raw = product;
    const extra = raw?.extraDiscount ?? null;

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

    // base price (sebelum auto-discount)
    let basePrice = Number(
      raw.price ??
        raw.base_price ??
        raw.basePrice ??
        raw.salePrice ??
        (Array.isArray(raw.prices) ? raw.prices[0] : undefined) ??
        0
    );

    let baseCompareAt = Number(
      raw.realprice ??
        raw.oldPrice ??
        (Array.isArray(raw.prices) ? raw.prices[1] : undefined) ??
        NaN
    );

    // fallback kalau list ga punya price tapi punya extraDiscount range
    if ((!Number.isFinite(basePrice) || basePrice <= 0) && extra?.baseMinPrice) {
      basePrice = Number(extra.baseMinPrice) || 0;
    }

    let price = basePrice;
    let compareAt = baseCompareAt;
    let extraDiscountLabel = "";

    if (extra) {
      extraDiscountLabel = String(extra.label || "").trim();

      // storewide: diskon nempel ke harga yang sedang tampil
      if (Number(extra.appliesTo) === 0) {
        const after = applyExtraDiscount(extra, basePrice);
        if (Number.isFinite(after) && after > 0 && after < basePrice) {
          compareAt = basePrice;
          price = after;
        }
      } else {
        // selain storewide: pakai range backend
        const after = Number(extra.finalMinPrice);
        const before = Number(extra.baseMinPrice) || basePrice;
        if (Number.isFinite(after) && after > 0 && Number.isFinite(before) && before > after) {
          price = after;
          compareAt = before;
        }
      }
    }

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
      slug: safeSlug,
      sale: Boolean(raw.sale),
      extraDiscountLabel,
    };
  }, [product]);

  const hasSale = Number.isFinite(item.compareAt) && item.compareAt > item.price;
  const discountPercent = getDiscountPercent(item.compareAt, item.price);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wishlist");
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch {}
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
    <Link
      href={href}
      className="group relative flex h-full w-full flex-col rounded-lg bg-white transition-all overflow-hidden"
    >
      <div className="relative">
        {/* Badge */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
          {(item.sale || hasSale) && (
            <div className="rounded-md bg-black/80 px-2 py-1 text-xs text-white">
              Sale
            </div>
          )}

          {item.extraDiscountLabel ? (
            <span className="rounded-full bg-primary-200 px-2 py-1 text-[10px] font-semibold text-primary-700">
              {item.extraDiscountLabel}
            </span>
          ) : discountPercent > 0 ? (
            <span className="rounded-full bg-primary-200 px-2 py-1 text-[10px] font-semibold text-primary-700">
              {discountPercent}% off
            </span>
          ) : null}
        </div>

        {/* Wishlist button */}
        <div
          className={`absolute top-4 right-4 z-10 transition-all duration-200
            ${
              isWishlisted
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
            }
            `}
        >
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
      </div>
    </Link>
  );
}
