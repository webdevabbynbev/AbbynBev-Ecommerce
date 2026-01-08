"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  Button,
  Chip,
  RegularCard,
  RegularCardSkeleton,
  TxtField,
} from "@/components";

import { getSale } from "@/services/api/promo.services";
import { normalizeProduct } from "@/services/api/normalizers/product";

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

function discountPercent(price, compareAt) {
  const p = Number(price || 0);
  const c = Number(compareAt || 0);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "lowest", label: "Lowest price" },
  { key: "highest", label: "Highest price" },
  { key: "discount", label: "Biggest discount" },
];

export default function SalePage() {
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [search, setSearch] = useState("");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getSale(); // ✅ GET /sale
        if (!alive) return;
        setSale(data);
      } catch (e) {
        console.error("Failed to load sale:", e);
        if (!alive) return;
        setSale(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const products = useMemo(() => {
    const rows = Array.isArray(sale?.products) ? sale.products : [];
    return rows.map(normalizeSaleProduct).filter(Boolean);
  }, [sale]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = String(p?.category || "").trim();
      if (c) set.add(c);
    }
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let rows = [...products];

    if (activeCategory !== "All") {
      const cat = activeCategory.toLowerCase();
      rows = rows.filter((p) => String(p.category || "").toLowerCase() === cat);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const brand = String(p.brand || "").toLowerCase();
        return name.includes(q) || brand.includes(q);
      });
    }

    if (sortBy === "lowest") {
      rows.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "highest") {
      rows.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "discount") {
      rows.sort((a, b) => {
        const da = discountPercent(a.price, a.compareAt);
        const db = discountPercent(b.price, b.compareAt);
        return db - da;
      });
    }

    return rows;
  }, [products, activeCategory, search, sortBy]);

  const endMs = sale?.endDatetime ? dayjs(sale.endDatetime).valueOf() : 0;
  const startMs = sale?.startDatetime ? dayjs(sale.startDatetime).valueOf() : 0;
  const countdown = endMs ? formatCountdown(endMs - now) : null;
  const hasCta = Boolean(sale?.hasButton && sale?.buttonUrl);
  const ctaText = sale?.buttonText || "Shop Now";
  const ctaUrl = sale?.buttonUrl || "#";
  const ctaIsExternal = /^https?:\/\//i.test(ctaUrl);

  return (
    <div className="Container items-center justify-center mx-auto overflow-visible">
      {/* Banner / Header */}
      <div className="w-full flex-col bg-primary-100 items-center justify-center bg-[url('/Logo_SVG_AB.svg')] bg-no-repeat bg-center">
        <div className="p-6 flex flex-col xl:max-w-[1280px] lg:max-w-[960px] mx-auto gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-damion text-4xl text-primary-700">
                {sale?.title || "Sale"}
              </h1>
              {sale?.description ? (
                <p className="text-sm text-neutral-600 max-w-2xl">
                  {sale.description}
                </p>
              ) : null}

              {startMs && endMs ? (
                <p className="text-xs text-neutral-500">
                  {dayjs(startMs).format("DD MMM YYYY, HH:mm")} —{" "}
                  {dayjs(endMs).format("DD MMM YYYY, HH:mm")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-2">
              {countdown ? (
                <div className="text-right">
                  <div className="text-[11px] text-neutral-500">Ends in</div>
                  <div className="text-lg font-bold text-primary-700">
                    {countdown}
                  </div>
                </div>
              ) : null}

              {hasCta ? (
                ctaIsExternal ? (
                  <a href={ctaUrl} target="_blank" rel="noreferrer">
                    <Button variant="primary" size="sm">
                      {ctaText}
                    </Button>
                  </a>
                ) : (
                  <a href={ctaUrl}>
                    <Button variant="primary" size="sm">
                      {ctaText}
                    </Button>
                  </a>
                )
              ) : null}
            </div>
          </div>

          {/* Search */}
          <div className="w-full max-w-[620px]">
            <TxtField
              placeholder="Search product on sale..."
              iconLeftName="MagnifyingGlass"
              variant="outline"
              size="md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <Chip
                key={s.key}
                isActive={sortBy === s.key}
                onClick={() => setSortBy(s.key)}
              >
                {s.label}
              </Chip>
            ))}
          </div>

          {/* Category chips (dynamic) */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Chip
                key={cat}
                isActive={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 xl:max-w-[1280px] lg:max-w-[960px] mx-auto space-y-4">
        {loading ? (
          <>
            <div className="text-xs text-neutral-500">Loading sale...</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <RegularCardSkeleton key={`sale-skel-${i}`} />
              ))}
            </div>
          </>
        ) : !sale ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-neutral-500">
            Belum ada sale yang aktif.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-neutral-500">
            Tidak ada produk yang cocok.
          </div>
        ) : (
          <>
            <p className="text-xs text-neutral-500">
              Showing {filtered.length} products on sale
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((p) => (
                <RegularCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}