"use client";
import Link from "next/link";
export function BrandCard({ logo, brandname, slug }) {
  return (
    <div className="bg-white p-4 rounded-lg w-auto h-auto max-w-[158px] flex items-center">
      <Link
        href={`/brand/${slug}`}
        className="group flex flex-col items-center justify-center space-y-3 bg-white rounded-xl transition-all"
      >
        <img
          src={logo}
          alt={brandname}
          className="w-auto h-auto object-contain"
        />
      </Link>
    </div>
  );
}
