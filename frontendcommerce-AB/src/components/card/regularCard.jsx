"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { BtnIconToggle } from "..";
import { formatToRupiah, slugify, getAverageRating } from "@/utils";
import { DataReview } from "@/data";

export function RegularCard({ product }) {
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
    const safeSlug = slugSource
      ? String(slugSource)
      : slugify(String(name || ""));

    return {
      id: String(id),
      name,
      price,
      compareAt,
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

  const reviewsForProduct = Array.isArray(DataReview)
    ? DataReview.filter((r) => r.productID === item.id)
    : [];

  const averageRating = getAverageRating(reviewsForProduct);

  const href = item.slug ? `/${encodeURIComponent(item.slug)}` : "#";

  return (
    <div className="group relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 transition-all overflow-hidden">
      <Link href={href}>
        <div className="image flex w-full items-center justify-center relative">
          {(item.sale || hasSale) && (
            <img
              src="/sale-tag.svg"
              alt="Sale"
              className="absolute top-0 left-0 z-10 w-10 h-auto"
            />
          )}

          <div
            className={`absolute top-4 right-4 z-10 transition-all duration-200
            ${isWishlisted
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

          <div className="image w-full">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";
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
            {hasSale ? (
              <>
                <div className="text-sm font-bold text-primary-700">
                  {formatToRupiah(item.price)}
                </div>
                <div className="text-xs font-medium text-neutral-400 line-through">
                  {formatToRupiah(item.compareAt)}
                </div>
              </>
            ) : (
              <div className="text-base font-bold text-primary-700">
                {formatToRupiah(item.price)}
              </div>
            )}
          </div>

          <div className="rating flex space-x-2 items-center">
            <div className="flex space-x-1 items-center">
              {averageRating === 0 ? (
                <span className="text-xs text-primary-700 font-light">
                  No rating
                </span>
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
