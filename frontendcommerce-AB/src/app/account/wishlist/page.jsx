"use client";

import { useState } from "react";
import Image from "next/image";


const wishlistItems = [
  {
    id: 1,
    brand: "AVOSKIN",
    name: "YSB Serum Salicylic Acid 2% + Zinc",
    image: "/images/sample-product.jpg",
    price: 135360,
    originalPrice: 169000,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 2,
    brand: "COSRX",
    name: "Advanced Snail 96 Mucin Power Essence",
    image: "/images/sample-product.jpg",
    price: 289000,
    originalPrice: 320000,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 3,
    brand: "MAYBELINE",
    name: "Superstay Vinyl Ink Tint",
    image: "/images/sample-product.jpg",
    price: 91495,
    originalPrice: 99900,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 4,
    brand: "MAYBELINE",
    name: "Superstay Vinyl Ink Tint",
    image: "/images/sample-product.jpg",
    price: 91495,
    originalPrice: 99900,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 5,
    brand: "AVOSKIN",
    name: "YSB Serum Salicylic Acid 2% + Zinc",
    image: "/images/sample-product.jpg",
    price: 135360,
    originalPrice: 169000,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 6,
    brand: "COSRX",
    name: "Advanced Snail 96 Mucin Power Essence",
    image: "/images/sample-product.jpg",
    price: 289000,
    originalPrice: 320000,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 7,
    brand: "MAYBELINE",
    name: "Superstay Vinyl Ink Tint",
    image: "/images/sample-product.jpg",
    price: 91495,
    originalPrice: 99900,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
  {
    id: 8,
    brand: "MAYBELINE",
    name: "Superstay Vinyl Ink Tint",
    image: "/images/sample-product.jpg",
    price: 91495,
    originalPrice: 99900,
    rating: 4.5,
    reviewCount: 12,
    isSale: true,
  },
];

function HeartToggle({ initial = true }) {
  const [active, setActive] = useState(initial);

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

export default function WishlistPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <span>Profile management</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pink-600 bg-pink-50 rounded-lg font-medium">
                <span>Wishlist</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <span>Order History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Wishlist</h2>

          {/* Grid produk */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:shadow-sm transition-shadow"
              >
                {/* Image + badges */}
                <div className="relative mb-3">
                  <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {item.isSale && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-semibold rounded-full bg-pink-600 text-white">
                      SALE
                    </span>
                  )}

                  <div className="absolute top-2 right-2">
                    <HeartToggle initial />
                  </div>
                </div>

                {/* Brand + name */}
                <p className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase mb-1">
                  {item.brand}
                </p>
                <p className="text-sm font-semibold text-gray-900 h-10 overflow-hidden">
                  {item.name}
                </p>

                {/* Pricing */}
                <div className="mt-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-pink-600 font-semibold">
                      Rp{item.price.toLocaleString("id-ID")}
                    </span>
                    {item.originalPrice && (
                      <span className="text-xs line-through text-gray-400">
                        Rp{item.originalPrice.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <span className="text-yellow-400">★</span>
                  <span className="font-medium text-gray-900">
                    {item.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">
                    ({item.reviewCount} reviews)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
