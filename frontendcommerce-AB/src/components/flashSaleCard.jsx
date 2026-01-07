"use client";
import Link from "next/link";
import { useMemo } from "react";
import { formatToRupiah, normalizeCardProduct, slugify } from "@/utils";

export function FlashSaleCard({ product, item }) {
  const data = useMemo(
    () => normalizeCardProduct(product ?? item),
    [product, item]
  );
  if (!data) return null;

  const hasSale =
    Number.isFinite(data.compareAt) && data.compareAt > data.price;

  const slugSource = data.slug || item?.slug || data.name;
  const safeSlug = slugSource ? slugify(String(slugSource)) : "";
  const href = safeSlug ? `/${encodeURIComponent(safeSlug)}` : "#";

  return (
    <div className="group relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 transition-all overflow-hidden">
      <Link href={href}>
        <div className="image flex w-full items-center justify-center relative">
          {(data.sale || hasSale) && (
            <img
              src="/sale-tag.svg"
              alt="Sale"
              className="absolute top-0 left-0 z-10 w-10 h-auto"
            />
          )}

          <div className="image">
            <img
              src={data.image}
              alt={data.name}
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
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
              {data.brand || "—"}
            </p>
            <p className="text-neutral-400 absolute top-0 left-0 translate-y-6 transition-transform duration-300 group-hover:translate-y-0">
              {data.category || "—"}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
