"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  RegularCard,
  TxtField,
  Filter,
  FlashSaleCard,
  RegularCardSkeleton,
} from "@/components";

import { getFlashSale, getSale } from "@/services/api/promo.services";
import { normalizeProduct } from "@/services/api/normalizers/product";
import { getBrands } from "@/services/api/brands.services";

function normalizeSaleProduct(raw) {
  const base = normalizeProduct(raw);
  if (!base) return null;

  const normalPrice = Number(raw?.price ?? base.price ?? 0);
  const salePrice = Number(raw?.salePrice ?? raw?.sale_price ?? 0);
  const isSale =
    Number.isFinite(salePrice) && salePrice > 0 && salePrice < normalPrice;

  return {
    ...base,
    price: isSale ? salePrice : normalPrice,
    realprice: isSale ? normalPrice : NaN,
    sale: isSale,
    salePrice: isSale ? salePrice : 0,
    stock: Number(raw?.stock ?? 0),
  };
}

function normalizeFlashSaleItem(raw) {
  if (!raw) return raw;

  const source = raw.product ?? raw;
  const basePrice = Number(
    source.price ?? source.basePrice ?? source.base_price ?? 0
  );
  const comparePrice = Number(
    source.realprice ??
      source.oldPrice ??
      source.original_price ??
      source.originalPrice ??
      0
  );
  const hasComparePrice = Number.isFinite(comparePrice) && comparePrice > 0;
  const normalPrice = hasComparePrice ? comparePrice : basePrice;
  let salePrice = Number(
    source.salePrice ??
      source.sale_price ??
      source.flashSalePrice ??
      source.flash_sale_price ??
      source.discountPrice ??
      source.discount_price ??
      0
  );
  let isSale =
    Number.isFinite(salePrice) && salePrice > 0 && salePrice < normalPrice;

  if (
    !isSale &&
    hasComparePrice &&
    Number.isFinite(basePrice) &&
    basePrice > 0 &&
    comparePrice > basePrice
  ) {
    salePrice = basePrice;
    isSale = true;
  }

  if (!isSale) return raw;

  const normalizedProduct = {
    ...source,
    price: salePrice,
    realprice: normalPrice,
    sale: true,
  };

  if (raw.product) {
    return {
      ...raw,
      product: normalizedProduct,
    };
  }

  return normalizedProduct;
}

export default function SaleClient() {
  const [loading, setLoading] = useState(true);
  const [flashSale, setFlashSale] = useState(null);
  const [productRows, setProductRows] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");
  const [visibleSaleCount, setVisibleSaleCount] = useState(12);
  const [visibleFlashCount, setVisibleFlashCount] = useState(8);
  const saleLoadRef = useRef(null);
  const flashLoadRef = useRef(null);
  const SALE_STEP = 12;
  const FLASH_STEP = 8;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const [flashSaleRes, saleRes, brandRes] = await Promise.all([
          getFlashSale(),
          getSale(),
          getBrands(),
        ]);
        if (!alive) return;

        setFlashSale(flashSaleRes?.serve ?? null);
        const saleItems =
          Array.isArray(saleRes?.list) && saleRes.list.length
            ? saleRes.list
            : saleRes?.serve
            ? [saleRes.serve]
            : [];
        const saleProducts = saleItems.flatMap((sale) =>
          Array.isArray(sale?.products) ? sale.products : []
        );
        setProductRows(saleProducts);
        setBrands(brandRes?.data ?? []);
      } catch (e) {
        console.error("Failed to load sale:", e);
        if (!alive) return;
        setFlashSale(null);
        setProductRows([]);
        setBrands([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const products = useMemo(() => {
    return productRows
      .map(normalizeSaleProduct)
      .filter(Boolean)
      .filter((product) => product.sale)
      .filter((product, index, list) => {
        const key =
          product.id ??
          product.slug ??
          product.sku ??
          `${product.name ?? "product"}-${product.brand ?? "brand"}`;

        return (
          list.findIndex((candidate) => {
            const candidateKey =
              candidate.id ??
              candidate.slug ??
              candidate.sku ??
              `${candidate.name ?? "product"}-${candidate.brand ?? "brand"}`;
            return candidateKey === key;
          }) === index
        );
      });
  }, [productRows]);

  const filtered = useMemo(() => {
    let rows = [...products];

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const brand = String(p.brand || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      });
    }

    return rows;
  }, [products, search]);

  const visibleFiltered = useMemo(() => {
    return filtered.slice(0, visibleSaleCount);
  }, [filtered, visibleSaleCount]);

  const buildSaleHrefQuery = (product) => {
    const salePrice = Number(product?.price ?? 0);
    const realPrice = Number(product?.realprice ?? 0);
    const params = {};

    if (Number.isFinite(salePrice) && salePrice > 0) {
      params.salePrice = salePrice;
    }

    if (Number.isFinite(realPrice) && realPrice > 0) {
      params.realPrice = realPrice;
    }

    return Object.keys(params).length ? params : undefined;
  };

  const flashSaleItems = useMemo(() => {
    if (Array.isArray(flashSale)) return flashSale;
    const source =
      flashSale?.products ??
      flashSale?.items ??
      flashSale?.list ??
      flashSale?.data ??
      [];
    return Array.isArray(source) ? source : [];
  }, [flashSale]);

  const normalizedFlashSaleItems = useMemo(() => {
    return flashSaleItems.map(normalizeFlashSaleItem);
  }, [flashSaleItems]);
  const visibleFlashItems = useMemo(() => {
    return normalizedFlashSaleItems.slice(0, visibleFlashCount);
  }, [normalizedFlashSaleItems, visibleFlashCount]);

  const skeleton_card = 24;
  const totalProducts = products.length;
  const totalBrands = brands.length;
  const visibleProducts = filtered.length;
  const statusLabel = loading
    ? "Sedang memuat promo terbaik..."
    : totalProducts === 0
    ? "Belum ada sale aktif saat ini."
    : `${visibleProducts} produk siap diburu.`;

  useEffect(() => {
    setVisibleSaleCount(SALE_STEP);
  }, [search, products]);

  useEffect(() => {
    setVisibleFlashCount(FLASH_STEP);
  }, [flashSaleItems]);

  useEffect(() => {
    const target = saleLoadRef.current;
    if (!target || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleSaleCount((prev) =>
            Math.min(prev + SALE_STEP, filtered.length)
          );
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered.length, loading]);

  useEffect(() => {
    const target = flashLoadRef.current;
    if (!target || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleFlashCount((prev) =>
            Math.min(prev + FLASH_STEP, normalizedFlashSaleItems.length)
          );
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [normalizedFlashSaleItems.length, loading]);

  return (
    <div className="w-full">
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary-50 via-white to-secondary-100">
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-secondary-200/70 blur-2xl" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
          <div className="flex-1 space-y-6">
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-primary-700">
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                Limited deals
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                Flash picks
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                Best value
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-800 sm:text-4xl lg:text-5xl">
                Diskon spesial untuk rutinitas cantik harianmu
              </h1>
              <p className="mt-3 max-w-xl text-sm text-neutral-600 sm:text-base">
                Temukan skincare dan makeup favorit dengan harga terbaik. Kurasi
                sale Abby n Bev hadir dengan pilihan brand tepercaya dan stok
                terbatas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="px-6"
                iconName="Tag"
                onClick={() => {
                  document
                    .getElementById("sale-products")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Lihat Produk Sale
              </Button>
              <span className="text-sm text-neutral-500">{statusLabel}</span>
            </div>
          </div>

          <div className="grid w-full max-w-lg flex-1 grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500">
                Produk Promo
              </p>
              <p className="mt-2 text-2xl font-bold text-primary-800">
                {loading ? "-" : totalProducts || 0}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                pilihan makeup & skincare
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500">
                Brand Pilihan
              </p>
              <p className="mt-2 text-2xl font-bold text-primary-800">
                {loading ? "-" : totalBrands || 0}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                koleksi favorit beauty lovers
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500">
                Flash Sale
              </p>
              <p className="mt-2 text-2xl font-bold text-primary-800">Live</p>
              <p className="mt-1 text-xs text-neutral-500">
                update cepat, stok terbatas
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold text-neutral-500">
                Highlight
              </p>
              <p className="mt-2 text-sm font-bold text-primary-800">
                Beauty essentials terlaris
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                hemat tanpa kompromi
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-6 mt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <TxtField
              placeholder="Cari produk sale..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              iconLeftName="MagnifyingGlass"
              className="w-full"
            />

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="tertiary"
                  className="w-fit px-6 sm:w-auto lg:hidden"
                >
                  Filter
                </Button>
              </DialogTrigger>

              <DialogContent className="flex max-h-[80vh] w-full flex-col overflow-y-auto overflow-x-hidden custom-scrollbar sm:max-w-100">
                <DialogHeader>
                  <DialogTitle>Filter</DialogTitle>
                </DialogHeader>
                <Filter
                  brands={brands}
                  showBrandFilter={true}
                  className="w-full pb-10"
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary-50 px-4 py-3 text-xs font-semibold text-primary-700 sm:justify-end">
            <span>Total produk: {loading ? "-" : totalProducts}</span>
            <span className="hidden sm:inline">|</span>
            <span>Terlihat: {loading ? "-" : visibleProducts}</span>
          </div>
        </div>
      </section>
      {flashSale ? (
        <section className="mx-auto w-full max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                Flash Sale
              </p>
              <h2 className="text-2xl font-bold text-primary-800">
                Buruan sebelum kehabisan
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Produk terpilih dengan diskon kilat setiap hari.
              </p>
            </div>
            <div className="rounded-full bg-secondary-100 px-4 py-2 text-xs font-semibold text-primary-700">
              Update otomatis dari stok terbaru
            </div>
          </div>
          <div className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <RegularCardSkeleton key={`flash-skel-${idx}`} />
                ))}
              </div>
            ) : normalizedFlashSaleItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {visibleFlashItems.map((item, idx) => (
                  <div
                    key={item?.id ?? item?.slug ?? `flash-${idx}`}
                    className="relative overflow-hidden rounded-2xl"
                  >
                    <span className="pointer-events-none absolute top-0 left-0 z-10 flex h-[26px] items-center rounded-br-lg bg-[#AE2D68] px-2 text-[10px] font-bold uppercase tracking-wide text-[#F6F6F6]">
                      Flash Sale
                    </span>
                    <FlashSaleCard product={item} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-secondary-100 bg-white/80 px-6 py-4 text-sm text-neutral-500">
                Belum ada flash sale aktif.
              </div>
            )}
          </div>
          {!loading && normalizedFlashSaleItems.length > visibleFlashCount ? (
            <div ref={flashLoadRef} className="h-10 w-full" />
          ) : null}
        </section>
      ) : null}

      <section className="mx-auto flex w-full max-w-7xl flex-col justify-between lg:flex-row">
        <div className="flex-1 p-6">
          <div
            id="sale-products"
            className="scroll-mt-28 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
          >
            {loading ? (
              [...Array(skeleton_card)].map((_, i) => (
                <RegularCardSkeleton key={`sale-skel-${i}`} />
              ))
            ) : totalProducts === 0 ? (
              <p className="col-span-full text-center py-20 text-neutral-400">
                Belum ada sale yang aktif.
              </p>
            ) : filtered.length > 0 ? (
              visibleFiltered.map((product, idx) => (
                <RegularCard
                  key={`${product.id ?? "product"}-${
                    product.slug ?? product.sku ?? idx
                  }`}
                  product={product}
                  hrefQuery={buildSaleHrefQuery(product)}
                />
              ))
            ) : (
              <p className="col-span-full text-center py-20 text-neutral-400">
                No products found.
              </p>
            )}
          </div>
          {!loading && filtered.length > visibleSaleCount ? (
            <div ref={saleLoadRef} className="h-10 w-full" />
          ) : null}
        </div>
      </section>
    </div>
  );
}
