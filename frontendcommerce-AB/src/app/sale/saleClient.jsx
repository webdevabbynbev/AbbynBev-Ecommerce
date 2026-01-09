"use client";

import React, { useEffect, useMemo, useState } from "react";

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
  RegularCardSkeleton,
} from "@/components";

import { getSale } from "@/services/api/promo.services";
import { normalizeProduct } from "@/services/api/normalizers/product";
import { getBrands } from "@/services/api/brands.services";
import Link from "next/link";
import FlashSaleCarousel from "@/components/carousel/flashSaleCarousel";

function normalizeSaleProduct(raw) {
  const base = normalizeProduct(raw);
  if (!base) return null;

  const salePrice = Number(raw?.salePrice ?? raw?.sale_price ?? 0);
  const normalPrice = Number(
    raw?.price ?? raw?.basePrice ?? raw?.base_price ?? base.price ?? 0
  );

  return {
    ...base,
    price: salePrice > 0 ? salePrice : normalPrice,
    realprice: salePrice > 0 ? normalPrice : NaN,
    sale: true,
    salePrice,
    stock: Number(raw?.stock ?? 0),
  };
}

export default function SaleClient() {
  const [loading, setLoading] = useState(true);
  const [flashSale, setFlashSale] = useState(null);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const [saleRes, brandRes] = await Promise.all([getSale(), getBrands()]);
        if (!alive) return;

        setFlashSale(saleRes ?? null);
        setBrands(brandRes?.data ?? []);
      } catch (e) {
        console.error("Failed to load sale:", e);
        if (!alive) return;
        setFlashSale(null);
        setBrands([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const saleItems = useMemo(() => {
    if (Array.isArray(flashSale?.list) && flashSale.list.length) {
      return flashSale.list;
    }
    return flashSale?.serve ? [flashSale.serve] : [];
  }, [flashSale]);

  const products = useMemo(() => {
    const rows = saleItems.flatMap((sale) =>
      Array.isArray(sale?.products) ? sale.products : []
    );

    return rows
      .map(normalizeSaleProduct)
      .filter(Boolean)
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
  }, [saleItems]);

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

  const skeleton_card = 24;

  return (
    <div className="flex w-full mx-auto flex-col justify-between xl:max-w-7xl lg:max-w-284 lg:flex-row">
      <h1 className="sr-only">Nikmati promo dan diskon makeup dan skincare di toko kosmetik Abby n Bev.</h1>
      {/* Sidebar (SAMA PERSIS kayak Best Seller) */}
      <div className="hidden w-75 lg:w-75 pl-10 pr-2 py-6 lg:block">
        <Filter
          brands={brands}
          showBrandFilter={true}
          className="w-full py-24"
        />
      </div>

      {/* Konten kanan (SAMA PERSIS kayak Best Seller) */}
      <div className="flex-1 p-6">
        {/* Search + tombol filter mobile */}
        <div className="mb-6 flex flex-row gap-3 sm:flex-row sm:items-center">
          <TxtField
            placeholder="Search products..."
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

        {/* Grid produk */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(skeleton_card)].map((_, i) => (
              <RegularCardSkeleton key={`sale-skel-${i}`} />
            ))
          ) : !flashSale ? (
            <p className="col-span-full text-center py-20 text-neutral-400">
              Belum ada sale yang aktif.
            </p>
          ) : filtered.length > 0 ? (
            filtered.map((product, idx) => (
              <RegularCard
                key={`${product.id ?? "product"}-${product.slug ?? product.sku ?? idx}`}
                product={product}
              />
            ))
          ) : (
            <p className="col-span-full text-center py-20 text-neutral-400">
              No products found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 