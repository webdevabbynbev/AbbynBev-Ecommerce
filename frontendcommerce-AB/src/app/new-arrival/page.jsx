"use client";

import Link from "next/link";
import { NewArrivaleCard } from "@/components";

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

export default function NewArrivalPage() {
  const heroProduct = NEW_PRODUCTS[0];
  const otherProducts = NEW_PRODUCTS.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-1">
          New arrivals
        </h1>
        <p className="text-sm text-neutral-500">
          Produk-produk terbaru yang baru saja hadir di Abby N Bev.
        </p>
      </div>

      {/* ZIG-ZAG BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-fr">
        {NEW_PRODUCTS.map((product, index) => {
          const isHeroLeft = index === 0;
          const isHeroRight = index === 6;

          let spanClass = "";

          if (isHeroLeft) {
            spanClass = "lg:col-span-2 lg:row-span-2";
          }

          if (isHeroRight) {
            spanClass = "lg:col-span-2 lg:row-span-2 lg:col-start-3";
          }

          return (
            <Link
              key={product.id}
              href={`/${product.slug}`}
              className={`
                ${spanClass}
                rounded-xl
                border
                border-neutral-200
                overflow-hidden
                hover:shadow-md
                transition-shadow
              `}
            >
              <RegularCard product={product} />
            </Link>
          );
        })}
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-fr">
        {/* HERO */}
        <Link
          href={`/${heroProduct.slug}`}
          className="
            col-span-2
            row-span-2
            rounded-2xl
            border
            border-neutral-200
            hover:shadow-md
            transition-shadow
            overflow-hidden
          "
        >
          <NewArrivaleCard product={heroProduct} />
        </Link>

        {/* REST */}
        {otherProducts.map((product) => (
          <Link
            key={product.id}
            href={`/${product.slug}`}
            className="
              rounded-xl
              border
              border-neutral-200
              hover:shadow-sm
              transition-shadow
              overflow-hidden
            "
          >
            <NewArrivaleCard product={product} />
          </Link>
        ))}
      </div>
    </div>
  );
}