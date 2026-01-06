"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NEW_PRODUCTS = [
  {
    id: 1,
    slug: "loreal-new-lip-tint",
    brand: "L'ORÉAL",
    name: "NEW Luxe Satin Lip Tint",
    image: "/images/sample-product.jpg",
    price: 159000,
    rating: 4.7,
    reviewCount: 32,
    category: "Makeup",
  },
  {
    id: 2,
    slug: "cosrx-snail-advanced-foam",
    brand: "COSRX",
    name: "Advanced Snail Gentle Foam Cleanser",
    image: "/images/sample-product.jpg",
    price: 145000,
    rating: 4.5,
    reviewCount: 21,
    category: "Cleanser",
  },
  {
    id: 3,
    slug: "avoskin-hydrating-serum",
    brand: "AVOSKIN",
    name: "Hydrating Glow Serum",
    image: "/images/sample-product.jpg",
    price: 189000,
    rating: 4.8,
    reviewCount: 18,
    category: "Serum",
  },
  {
    id: 4,
    slug: "hada-labo-brightening-wash",
    brand: "HADA LABO",
    name: "Brightening Face Wash",
    image: "/images/sample-product.jpg",
    price: 69000,
    rating: 4.3,
    reviewCount: 40,
    category: "Cleanser",
  },
  {
    id: 5,
    slug: "laneige-water-sleeping-mask",
    brand: "LANEIGE",
    name: "Water Sleeping Mask Fresh",
    image: "/images/sample-product.jpg",
    price: 329000,
    rating: 4.6,
    reviewCount: 55,
    category: "Mask",
  },
  {
    id: 6,
    slug: "somebymi-cica-cleansing-balm",
    brand: "SOME BY MI",
    name: "Cica Cleansing Balm",
    image: "/images/sample-product.jpg",
    price: 179000,
    rating: 4.4,
    reviewCount: 22,
    category: "Cleanser",
  },
  {
    id: 7,
    slug: "skin1004-new-sunscreen",
    brand: "SKIN1004",
    name: "Madagascar Centella Air-Fit Suncream SPF50+",
    image: "/images/sample-product.jpg",
    price: 149000,
    rating: 4.7,
    reviewCount: 60,
    category: "Sunscreen",
  },
  {
    id: 8,
    slug: "cosrx-propolis-toner",
    brand: "COSRX",
    name: "Full Fit Propolis Toner",
    image: "/images/sample-product.jpg",
    price: 210000,
    rating: 4.5,
    reviewCount: 48,
    category: "Toner",
  },
  {
    id: 9,
    slug: "banila-co-clean-it-zero",
    brand: "BANILA CO",
    name: "Clean It Zero Purifying Balm",
    image: "/images/sample-product.jpg",
    price: 259000,
    rating: 4.6,
    reviewCount: 70,
    category: "Cleanser",
  },
  {
    id: 10,
    slug: "innisfree-black-tea-ampoule",
    brand: "INNISFREE",
    name: "Black Tea Youth Enhancing Ampoule",
    image: "/images/sample-product.jpg",
    price: 345000,
    rating: 4.8,
    reviewCount: 37,
    category: "Serum",
  },
  {
    id: 11,
    slug: "biore-aqua-rich-new",
    brand: "BIORE",
    name: "UV Aqua Rich Light Up Essence SPF50+",
    image: "/images/sample-product.jpg",
    price: 139000,
    rating: 4.4,
    reviewCount: 44,
    category: "Sunscreen",
  },
  {
    id: 12,
    slug: "etude-fixing-tint",
    brand: "ETUDE",
    name: "Fixing Tint Velvet",
    image: "/images/sample-product.jpg",
    price: 125000,
    rating: 4.5,
    reviewCount: 29,
    category: "Makeup",
  },
];

function HeartButton() {
  const [active, setActive] = useState(true);
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

export default function NewArrivalPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    let products = [...NEW_PRODUCTS];

    if (activeCategory !== "All") {
      products = products.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (minRating > 0) {
      products = products.filter((p) => p.rating >= minRating);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }

    return products;
  }, [activeCategory, minRating, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">New arrivals</h1>
        <p className="text-sm text-gray-500">
          Produk-produk terbaru yang baru saja hadir di Abby N Bev.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Grid products */}
        <section className="flex-1">
          {/* Info jumlah produk */}
          <p className="text-xs text-gray-500 mb-3">
            Showing {filteredProducts.length} new products
          </p>

          {/* Grid produk */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">
              Belum ada produk yang cocok dengan filtermu.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                // TODO: ganti href ke halaman detail produk jika sudah ada
                const href = "#";

                return (
                  <Link
                    key={product.id}
                    href={href}
                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:shadow-sm transition-shadow"
                  >
                    {/* Image */}
                    <div className="relative mb-3">
                      <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden bg-gray-50">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      </div>

                      {/* Badge NEW kecil di pojok kiri atas */}
                      <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold rounded-full bg-pink-600 text-white">
                        NEW
                      </span>

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

                    {/* Price */}
                    <div className="mt-2 text-sm">
                      <span className="text-pink-600 font-semibold">
                        Rp{product.price.toLocaleString("id-ID")}
                      </span>
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
