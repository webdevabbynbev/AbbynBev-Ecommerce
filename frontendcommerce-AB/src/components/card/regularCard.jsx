"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { BtnIconToggle } from "..";
import { formatToRupiah, slugify, getAverageRating } from "@/utils";
import { DataReview } from "@/data";

const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

export function RegularCard({ product, hrefQuery }) {
  const [wishlist, setWishlist] = useState([]);

  if (!product) return null;

  const item = useMemo(() => {
    // support: bisa product normal / bisa row yang punya `.product`
    const raw = product?.product ?? product;

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

    const basePrice = Number(
      raw.basePrice ??
        raw.base_price ??
        raw.base ??
        raw.price ??
        raw.salePrice ??
        (Array.isArray(raw.prices) ? raw.prices[0] : undefined) ??
        0
    );

    // Harga “saat ini” (kalau normalizer udah override diskon, ini udah final)
    const currentPrice = Number(
      raw.price ??
        raw.salePrice ??
        raw.basePrice ??
        raw.base_price ??
        (Array.isArray(raw.prices) ? raw.prices[0] : undefined) ??
        0
    );

    // Untuk SALE (harga coret sale)
    const compareAt = Number(
      raw.realprice ??
        raw.oldPrice ??
        raw.compareAt ??
        raw.compare_at ??
        (Array.isArray(raw.prices) ? raw.prices[1] : undefined) ??
        NaN
    );

    // ===== DISKON ENGINE =====
    // Prefer dari normalizer: discountPercent, discountCompareAt, discountFinalPrice
    let discountPercent = Number(raw.discountPercent ?? NaN);
    let discountCompareAt = Number(raw.discountCompareAt ?? NaN);
    let discountFinalPrice = Number(raw.discountFinalPrice ?? NaN);

    // Fallback: baca langsung dari backend `extraDiscount` (kalau normalizer belum ngisi field di atas)
    const extra = raw.extraDiscount ?? null;
    if (extra) {
      const eligible = Number(extra.eligibleMinPrice ?? extra.baseMinPrice ?? NaN);
      const final = Number(extra.finalMinPrice ?? NaN);

      if (
        Number.isFinite(eligible) &&
        Number.isFinite(final) &&
        eligible > 0 &&
        final > 0 &&
        eligible > final
      ) {
        discountCompareAt = eligible;
        discountFinalPrice = final;

        const valueType = Number(extra.valueType ?? NaN); // 1=percent
        const value = Number(extra.value ?? NaN);

        if (valueType === 1 && Number.isFinite(value) && value > 0) {
          discountPercent = value;
        } else {
          discountPercent = ((eligible - final) / eligible) * 100;
        }
      }
    }

    // kalau normalizer belum set discountFinalPrice dan fallback juga gak dapet, anggap currentPrice final
    if (!Number.isFinite(discountFinalPrice) || discountFinalPrice <= 0) {
      discountFinalPrice = currentPrice || basePrice;
    }

    const image =
      raw.image ??
      (Array.isArray(raw.images) ? raw.images[0] : null) ??
      PLACEHOLDER_IMAGE;

    const slugSource = raw.slug || raw.path || "";
    const safeSlug = slugSource ? String(slugSource) : slugify(String(name || ""));

    return {
      id: String(id),
      name,
      basePrice,
      price: currentPrice,
      compareAt,

      discountPercent,
      discountCompareAt,
      discountFinalPrice,

      image,
      rating: Number(raw.rating ?? raw.stars ?? 0),
      brand:
        raw.brand?.name ??
        raw.brand?.brandname ??
        raw.brand ??
        raw.brandName ??
        "",
      category:
        raw.categoryType?.name ??
        raw.category_type?.name ??
        raw.category?.name ??
        raw.category?.categoryname ??
        raw.category ??
        raw.categoryName ??
        "",
      slug: safeSlug,

      // flag sale dari backend (kalau ada)
      sale: Boolean(raw.sale),
    };
  }, [product]);

  // diskon engine dianggap aktif kalau ada compareAt diskon > final
  const discountActive =
    Number.isFinite(item.discountCompareAt) &&
    Number.isFinite(item.discountFinalPrice) &&
    item.discountCompareAt > item.discountFinalPrice;

  // SALE aktif kalau: flag sale dari backend, atau compareAt > price
  // tapi compareAt JANGAN “ngalahin” diskon engine (biar diskon engine gak kebaca sebagai sale)
  const hasSalePrice = Number.isFinite(item.compareAt) && item.compareAt > item.price;
  const saleActive = item.sale || (hasSalePrice && !discountActive);

  // badge diskon
  const computedPercent = discountActive
    ? Math.round(
        ((item.discountCompareAt - item.discountFinalPrice) / item.discountCompareAt) * 100
      )
    : null;

  const discountBadge =
    discountActive && Number.isFinite(item.discountPercent) && item.discountPercent > 0
      ? `-${Math.round(item.discountPercent)}%`
      : discountActive && computedPercent && computedPercent > 0
        ? `-${computedPercent}%`
        : discountActive
          ? "-DISC"
          : null;

  // harga tampil & harga coret
  const displayPrice = discountActive ? item.discountFinalPrice : item.price;

  const strikePrice = saleActive
    ? (Number.isFinite(item.compareAt) && item.compareAt > item.price ? item.compareAt : NaN)
    : (discountActive ? item.discountCompareAt : NaN);

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

  const reviewsForProduct = Array.isArray(DataReview)
    ? DataReview.filter((r) => r.productID === item.id)
    : [];

  const averageRating = getAverageRating(reviewsForProduct);

  const queryString = useMemo(() => {
    if (!hrefQuery || typeof hrefQuery !== "object") return "";
    const params = new URLSearchParams();

    Object.entries(hrefQuery).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });

    return params.toString();
  }, [hrefQuery]);

  const slugHref = item.slug ? `/${encodeURIComponent(item.slug)}` : "#";
  const href = queryString ? `${slugHref}?${queryString}` : slugHref;

  return (
    <div className="group relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 transition-all overflow-hidden">
      <Link href={href}>
        <div className="image flex w-full items-center justify-center relative">
          {/* PRIORITAS BADGE:
              1) SALE/FLASH (existing)
              2) DISKON (discount engine)
           */}
          {saleActive ? (
            <img
              src="/sale-tag.svg"
              alt="Sale"
              className="absolute top-0 left-0 z-10 w-10 h-auto"
            />
          ) : discountActive && discountBadge ? (
            <span className="absolute top-0 left-0 z-10 flex h-[26px] items-center rounded-br-lg bg-primary-700 px-2 text-[10px] font-bold uppercase tracking-wide text-white">
              {discountBadge}
            </span>
          ) : null}

          <div
            className={`absolute top-4 right-4 z-10 transition-all duration-200
            ${
              isWishlisted
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
            }`}
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

          <div className="image w-full">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
            />
          </div>
        </div>

        <div className="content-wrapper w-full space-y-2 p-4">
          <div className="category-and-name space-y-1">
            <div className="text-sm font-bold text-neutral-950 line-clamp-2">
              {item.name}
            </div>
          </div>

          <div className="price flex items-center space-x-2">
            {Number.isFinite(strikePrice) && strikePrice > displayPrice ? (
              <>
                <div className="text-sm font-bold text-primary-700">
                  {formatToRupiah(displayPrice)}
                </div>
                <div className="text-xs font-medium text-neutral-400 line-through">
                  {formatToRupiah(strikePrice)}
                </div>
              </>
            ) : (
              <div className="text-base font-bold text-primary-700">
                {formatToRupiah(displayPrice)}
              </div>
            )}
          </div>

          <div className="rating flex space-x-2 items-center">
            <div className="flex space-x-1 items-center">
              {averageRating === 0 ? (
                <span className="text-xs text-primary-700 font-light">No rating</span>
              ) : (
                <div className="flex items-center space-x-1 font-bold text-primary-700 text-xs">
                  <span>{averageRating}</span>
                  <FaStar className="h-3 w-3 text-warning-300" />
                </div>
              )}
            </div>
            <div className="w-1 h-1 rounded-full bg-neutral-400" />
            <div className="text-xs font-light text-neutral-300">
              ({reviewsForProduct.length} reviews)
            </div>
          </div>

          <div className="text-xs category-brand flex flex-row relative items-center space-x-1.5 overflow-hidden h-6">
            <p className="text-neutral-400 transition-transform duration-300 group-hover:-translate-y-6">
              {item.brand || "—"}
            </p>
            <p className="text-neutral-400 absolute top-0 left-0 translate-y-6 transition-transform duration-300 group-hover:translate-y-0">
              {item.category || "—"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
