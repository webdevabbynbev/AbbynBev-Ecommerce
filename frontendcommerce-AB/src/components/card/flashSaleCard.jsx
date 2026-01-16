"use client";
import Link from "next/link";
import { useMemo } from "react";
import { formatToRupiah, normalizeCardProduct, slugify } from "@/utils";
import { ProgressBar } from "../progress/progressBar";

export function FlashSaleCard({ product, item, hrefQuery }) {
  const flashStock = 100;
  const flashStockLeft = 10;
  const data = useMemo(() => {
    if (!product && !item) return null;
    const raw = product ?? item;
    const source = raw.product ?? raw;

    const name =
      source.name ?? source.productName ?? source.title ?? "Unnamed Product";

    // API sends flash sale price in `flashPrice` and original price in `price`
    const salePrice = Number(source.flashPrice ?? 0);
    const originalPrice = Number(source.price ?? 0);

    const isSale = salePrice > 0 && salePrice < originalPrice;

    const finalPrice = isSale ? salePrice : originalPrice;
    const comparePrice = isSale ? originalPrice : NaN;

    const image =
      source.image ??
      (Array.isArray(source.images) ? source.images[0] : null) ??
      (Array.isArray(source.medias) ? source.medias[0]?.url : null) ??
      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png";

    return {
      id: source.id ?? source._id ?? crypto.randomUUID(),
      name,
      price: finalPrice,
      compareAt: comparePrice,
      image,
      rating: Number(source.rating ?? source.stars ?? 0),
      brand:
        source.brand?.name ??
        source.brand?.brandname ??
        source.brand ??
        source.brandName ??
        "",
      category:
        source.categoryType?.name ??
        source.category_type?.name ??
        source.category?.name ??
        source.category?.categoryname ??
        source.category ??
        source.categoryName ??
        "",
      slug: slugify(source.slug || source.path || name || ""),
      sale: isSale,
    };
  }, [product, item]);

  if (!data) return null;

  const hasSale =
    Number.isFinite(data.compareAt) && data.compareAt > data.price;

  const queryString = useMemo(() => {
    if (!hrefQuery || typeof hrefQuery !== "object") return "";
    const params = new URLSearchParams();

    Object.entries(hrefQuery).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });

    return params.toString();
  }, [hrefQuery]);

  const slugSource = data.slug || item?.slug || data.name;
  const safeSlug = slugSource ? slugify(String(slugSource)) : "";
  const slugHref = safeSlug ? `/${encodeURIComponent(safeSlug)}` : "#";
  const href = queryString ? `${slugHref}?${queryString}` : slugHref;

  // ===== FLASH SALE PROGRESS =====
  const totalStock = Number(flashStock ?? 0);
  const stockLeft = Number(flashStockLeft ?? 0);

  const progress =
    totalStock > 0 ? Math.round((stockLeft / totalStock) * 100) : 0;

  return (
    <div className="group relative flex h-full w-full flex-col rounded-lg bg-white space-y-4 transition-all overflow-hidden">
      <Link href={href}>
        <div className="image flex w-full items-center justify-center relative">
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

          {/* PRICE */}
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

          {/* 🔥 FLASH SALE PROGRESS */}
          {totalStock > 0 && (
            <div className="space-y-1">
              <ProgressBar value={progress} height={6} />
              <p className="text-xs text-neutral-500">
                Tersisa{" "}
                <span className="font-bold text-primary-700">{stockLeft}</span>{" "}
                dari {totalStock}
              </p>
            </div>
          )}

          {/* BRAND / CATEGORY */}
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
