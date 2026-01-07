"use client";

import { Fragment, useEffect, useState } from "react";
import { NewArrivaleCard } from "@/components";
import { getProducts } from "@/services/api/product.services";
import { getBrands } from "@/services/api/brands.services";

export default function NewArrivalPage() {
  const sections = [];
  const [products, setProducts] = useState([]);
  const [, setLoading] = useState(false);
  const [, setBrands] = useState([]);
  const [, setMeta] = useState({});
  const page = 1;
  const itemsPerPage = 16;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resProducts, resBrands] = await Promise.all([
          getProducts({
            page: page,
            per_page: itemsPerPage,
          }),
          getBrands(),
        ]);

        setProducts(resProducts.data || []);
        setMeta(resProducts.meta || {});
        setBrands(resBrands.data || []);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [1, 16]);

  // 1 hero + 4 small (AMAN untuk grid 5 kolom)
  for (let i = 0; i < products.length; i += 5) {
    sections.push(products.slice(i, i + 5));
  }

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

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 auto-rows-fr grid-flow-dense">
        {sections.map((group, index) => {
          const isFullSection = group.length === 5;
          const hero = isFullSection ? group[0] : null;
          const rest = isFullSection ? group.slice(1) : group;
          const isHeroLeft = index % 2 === 0;

          return (
            <Fragment key={index}>
              {/* HERO KIRI (HANYA JIKA SECTION FULL) */}
              {isHeroLeft && hero && (
                <div className="col-span-2 row-span-2">
                  <NewArrivaleCard product={hero} />
                </div>
              )}

              {/* SMALL CARDS */}
              {rest.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-neutral-200 hover:shadow-sm transition-shadow overflow-hidden"
                >
                  <NewArrivaleCard product={product} />
                </div>
              ))}

              {/* HERO KANAN (HANYA JIKA SECTION FULL) */}
              {!isHeroLeft && hero && (
                <div className="col-span-2 row-span-2">
                  <NewArrivaleCard product={hero} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
