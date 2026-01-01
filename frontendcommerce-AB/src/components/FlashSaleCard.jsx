"use client";
import { FaStar } from "react-icons/fa6"; // pastikan import benar
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BtnIconToggle, RegularCardSkeleton } from ".";
import { formatToRupiah, normalizeCardProduct } from "@/utils";
import { DataReview } from "@/data";

export function FlashSaleCard({ product, item }) {
  const data = useMemo(
    () => normalizeCardProduct(product ?? item),
    [product, item]
  );
  if (!data) return null;

  const hasSale =
    Number.isFinite(data.compareAt) && data.compareAt > data.price;

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("wishlist");
    if (stored) setWishlist(JSON.parse(stored));
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const handleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      return exists
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product];
    });
  };

  const isWishlisted = wishlist.some((p) => p.id === data.id);

  const reviewsForProduct = Array.isArray(DataReview)
    ? DataReview.filter((r) => r.productID === data.id)
    : [];

  if (loading) return <RegularCardSkeleton />;

  const href =
    item?.brandSlug && item?.slug
      ? `/${encodeURIComponent(item.brandSlug)}/${encodeURIComponent(
          item.slug
        )}`
      : "#";

  return (
    <div className="group relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 transition-all overflow-hidden">
      <Link href={href}>
        <div className="image flex w-full items-center justify-center relative">
          {(data.sale || hasSale) && (
            <img
              src="/sale-tag.svg"
              alt="Sale"
              className="absolute top-0 left-0 z-10 w-[40px] h-auto"
            />
          )}

          <div className="absolute top-4 right-4 z-10">
            <BtnIconToggle
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleWishlist(data);
              }}
              iconName="Heart"
              variant="tertiary"
              size="md"
            />
          </div>

          <div className="image">
            <img
              src={data.image}
              alt={data.name}
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://res.cloudinary.com/dlrpvteyx/image/upload/v1766202017/placeholder.png";
              }}
            />
          </div>
        </div>

        <div className="content-wrapper w-full space-y-2 p-4">
          <div className="category-and-name space-y-1">
            <div className="text-sm font-bold text-neutral-950 line-clamp-2">
              {data.name}
            </div>
          </div>

          <div className="price flex items-center space-x-2">
            {hasSale ? (
              <>
                <div className="text-sm font-bold text-primary-700">
                  {formatToRupiah(data.price)}
                </div>
                <div className="text-xs font-medium text-neutral-400 line-through">
                  {formatToRupiah(data.compareAt)}
                </div>
              </>
            ) : (
              <div className="text-base font-bold text-primary-700">
                {formatToRupiah(data.price)}
              </div>
            )}
          </div>

          <div className="text-xs category-brand flex flex-row relative items-center space-x-1.5 overflow-hidden h-6">
            <p className="text-neutral-400 transition-transform duration-300 group-hover:-translate-y-6">
              {data.category || "—"}
            </p>
            <p className="text-neutral-400 absolute top-0 left-0 translate-y-6 transition-transform duration-300 group-hover:translate-y-0">
              {data.brand || "—"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
