"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ========= DUMMY DATA PRODUK SHOP (boleh diganti nanti) =========
const SHOP_PRODUCTS = [
  {
    id: 1,
    slug: "avoskin-ysb-serum-salicylic",
    brand: "AVOSKIN",
    name: "YSB Serum Salicylic Acid 2% + Zinc",
    image: "/images/sample-product.jpg",
    price: 135_360,
    originalPrice: 169_000,
    rating: 4.5,
    reviewCount: 112,
    category: "Serum",
  },
  {
    id: 2,
    slug: "cosrx-advanced-snail-96",
    brand: "COSRX",
    name: "Advanced Snail 96 Mucin Power Essence",
    image: "/images/sample-product.jpg",
    price: 289_000,
    originalPrice: 320_000,
    rating: 4.7,
    reviewCount: 89,
    category: "Essence",
  },
  {
    id: 3,
    slug: "cosrx-niacinamide-15",
    brand: "COSRX",
    name: "The Niacinamide 15 Serum",
    image: "/images/sample-product.jpg",
    price: 249_000,
    originalPrice: 280_000,
    rating: 4.6,
    reviewCount: 64,
    category: "Serum",
  },
  {
    id: 4,
    slug: "cosrx-vit-c-23",
    brand: "COSRX",
    name: "The Vitamin C 23 Serum",
    image: "/images/sample-product.jpg",
    price: 265_000,
    originalPrice: 310_000,
    rating: 4.4,
    reviewCount: 52,
    category: "Serum",
  },
  {
    id: 5,
    slug: "somebymi-acne-foam",
    brand: "SOME BY MI",
    name: "AHA BHA PHA 30 Days Miracle Acne Clear Foam",
    image: "/images/sample-product.jpg",
    price: 110_000,
    originalPrice: 135_000,
    rating: 4.3,
    reviewCount: 40,
    category: "Cleanser",
  },
  {
    id: 6,
    slug: "sunscreen-gel-bright",
    brand: "SKIN1004",
    name: "Sunscreen Brightening Watery Gel SPF50+",
    image: "/images/sample-product.jpg",
    price: 139_000,
    originalPrice: 165_000,
    rating: 4.6,
    reviewCount: 74,
    category: "Sunscreen",
  },
  {
    id: 7,
    slug: "sunscreen-matte",
    brand: "SKIN1004",
    name: "Sunscreen Ultra Matte Finish SPF50+",
    image: "/images/sample-product.jpg",
    price: 145_000,
    originalPrice: 175_000,
    rating: 4.5,
    reviewCount: 53,
    category: "Sunscreen",
  },
  {
    id: 8,
    slug: "toner-miracle",
    brand: "AVOSKIN",
    name: "Miraculous Refining Toner",
    image: "/images/sample-product.jpg",
    price: 189_000,
    originalPrice: 219_000,
    rating: 4.8,
    reviewCount: 180,
    category: "Toner",
  },
  {
    id: 9,
    slug: "cleanser-gentle",
    brand: "SENKA",
    name: "Perfect Whip Gentle Cleanser",
    image: "/images/sample-product.jpg",
    price: 59_000,
    originalPrice: 80_000,
    rating: 4.2,
    reviewCount: 36,
    category: "Cleanser",
  },
  {
    id: 10,
    slug: "lotion-hydrating",
    brand: "HADA LABO",
    name: "Gokujyun Hydrating Lotion",
    image: "/images/sample-product.jpg",
    price: 78_000,
    originalPrice: 95_000,
    rating: 4.7,
    reviewCount: 120,
    category: "Toner",
  },
  {
    id: 11,
    slug: "ampoule-cica",
    brand: "SOME BY MI",
    name: "Cica Ampoule Soothing",
    image: "/images/sample-product.jpg",
    price: 210_000,
    originalPrice: 250_000,
    rating: 4.4,
    reviewCount: 55,
    category: "Serum",
  },
  {
    id: 12,
    slug: "cream-brightening",
    brand: "LANEIGE",
    name: "Radian-C Brightening Cream",
    image: "/images/sample-product.jpg",
    price: 325_000,
    originalPrice: 389_000,
    rating: 4.6,
    reviewCount: 77,
    category: "Cream",
  },
];

const CATEGORIES = [
  "All",
  "Serum",
  "Essence",
  "Toner",
  "Cleanser",
  "Sunscreen",
  "Cream",
];

const SORT_OPTIONS = [
  { key: "recommended", label: "Recommended" },
  { key: "lowest", label: "Lowest price" },
  { key: "highest", label: "Highest price" },
  { key: "discount", label: "Biggest discount" },
];

const RATING_OPTIONS = [
  { value: 4.5, label: "4.5 & above" },
  { value: 4, label: "4 & above" },
  { value: 3.5, label: "3.5 & above" },
  { value: 0, label: "All rating" },
];

function calcDiscountPercent(price, originalPrice) {
  if (!price || !originalPrice || originalPrice <= price) return null;
  const diff = originalPrice - price;
  return Math.round((diff / originalPrice) * 100);
}

function StarRow({ count = 5 }) {
  return (
    <span className="text-xs text-yellow-400">
      {"★".repeat(count)}
    </span>
  );
}

function HeartButton() {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setActive((prev) => !prev);
      }}
      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill={active ? "#ec4899" : "none"}
        stroke={active ? "#ec4899" : "#4b5563"}
        strokeWidth="1.8"
      >
        <path d="M12 21s-5.5-3.7-8.4-7C1.8 11.5 2 8.3 4.2 6.6 6.4 5 9.1 5.7 12 8.3c2.9-2.6 5.6-3.3 7.8-1.7 2.2 1.7 2.4 4.9.6 7.4-2.9 3.3-8.4 7-8.4 7z" />
      </svg>
    </button>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    let products =
      activeCategory === "All"
        ? [...SHOP_PRODUCTS]
        : SHOP_PRODUCTS.filter(
            (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
          );

    if (minRating > 0) {
      products = products.filter((p) => p.rating >= minRating);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (sortBy === "lowest") {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === "highest") {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      products.sort((a, b) => {
        const da = calcDiscountPercent(a.price, a.originalPrice) || 0;
        const db = calcDiscountPercent(b.price, b.originalPrice) || 0;
        return db - da;
      });
    }

    return products;
  }, [activeCategory, sortBy, minRating, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* BANNER ATAS – mirip Sale, tapi versi Shop */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-300 via-pink-200 to-amber-200 h-40 md:h-52 flex items-center px-6 md:px-10">
          <div className="absolute -right-10 -bottom-16 w-52 h-52 bg-pink-400/40 rounded-full blur-3xl" />
          <div className="absolute right-10 top-4 hidden md:block">
            <Image
              src="/images/sample-product.jpg"
              alt="Shop banner"
              width={120}
              height={120}
              className="rounded-2xl shadow-xl object-cover"
            />
          </div>

          <div className="relative z-10 max-w-md">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-pink-700 mb-1">
              Beauty Products
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-pink-900 mb-2">
              Shop all products
            </h1>
            <p className="text-xs md:text-sm text-pink-800/90">
              Explore all skincare and makeup favorites from Abby N Bev in one
              place.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + SORT BAR – mirip sale */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:max-w-xl">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products here..."
            className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-pink-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-full px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT FILTER + RIGHT GRID (kaya sale) */}
      <div className="flex gap-8">
        {/* SIDEBAR FILTER */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Filter</h2>
              <span className="text-[11px] text-gray-400 font-medium">
                All items
              </span>
            </div>

            {/* Category */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Category
              </p>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={activeCategory === cat}
                      onChange={() => setActiveCategory(cat)}
                      className="h-3 w-3 border-gray-300 text-pink-600 focus:ring-pink-400"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Rating
              </p>
              <div className="space-y-1">
                {RATING_OPTIONS.map((opt, index) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMinRating(opt.value)}
                    className={`w-full flex items-center justify-between rounded-md px-2 py-1 text-[11px] ${
                      minRating === opt.value
                        ? "bg-pink-50 text-pink-600"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {index < RATING_OPTIONS.length - 1 && (
                        <StarRow count={5} />
                      )}
                      <span>{opt.label}</span>
                    </div>
                    {minRating === opt.value && (
                      <span className="text-[10px]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button className="mt-4 w-full rounded-full bg-pink-600 text-white text-xs font-medium py-2 hover:bg-pink-700 transition-colors">
              Apply filter
            </button>
          </div>
        </aside>

        {/* GRID PRODUK */}
        <section className="flex-1">
          <p className="text-xs text-gray-500 mb-3">
            Showing {filteredProducts.length} products
          </p>

          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">
              Belum ada produk yang cocok dengan filtermu.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const discount = calcDiscountPercent(
                  product.price,
                  product.originalPrice
                );

                const href = "#"; // TODO: ganti ke route detail product

                return (
                  <Link
                    key={product.id}
                    href={href}
                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:shadow-sm transition-shadow"
                  >
                    {/* Image + badge */}
                    <div className="relative mb-3">
                      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      </div>

                      {discount && (
                        <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold rounded-full bg-orange-400 text-white">
                          -{discount}%
                        </span>
                      )}

                      <div className="absolute top-2 right-2">
                        <HeartButton />
                      </div>
                    </div>

                    {/* Brand + name */}
                    <p className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase mb-1">
                      {product.brand}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 h-10 overflow-hidden">
                      {product.name}
                    </p>

                    {/* Pricing */}
                    <div className="mt-2 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-pink-600 font-semibold">
                          Rp{product.price.toLocaleString("id-ID")}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs line-through text-gray-400">
                            Rp{product.originalPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium text-gray-900">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">
                        ({product.reviewCount} reviews)
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
