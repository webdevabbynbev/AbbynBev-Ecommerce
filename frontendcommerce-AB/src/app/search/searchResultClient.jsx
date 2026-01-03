"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Filter,
  RegularCard,
  RegularCardSkeleton,
} from "@/components";

function ProductSkeletonGrid({ count = 24 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <RegularCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function SearchResultsClient({
  initialQ,
  initialProducts,
  initialMeta,
  brands,
  itemsPerPage = 24,
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const q = (sp.get("q") || initialQ || "").trim();
  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || itemsPerPage);

  // support beberapa key brand
  const brand = sp.get("brand") || sp.get("brands") || sp.get("brand_id") || "";

  const [products, setProducts] = useState(initialProducts || []);
  const [meta, setMeta] = useState(initialMeta || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(initialProducts || []);
    setMeta(initialMeta || {});
  }, [initialProducts, initialMeta, initialQ]);

  const keyNow = useMemo(
    () => JSON.stringify({ q, page, limit, brand }),
    [q, page, limit, brand]
  );
  const keyInitial = useMemo(
    () =>
      JSON.stringify({ q: initialQ, page: 1, limit: itemsPerPage, brand: "" }),
    [initialQ, itemsPerPage]
  );

  useEffect(() => {
    if (!q) return;

    if (keyNow === keyInitial) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const url =
          `/api/products/search?q=${encodeURIComponent(q)}` +
          `&page=${page}&limit=${limit}` +
          (brand ? `&brand=${encodeURIComponent(brand)}` : "");

        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();

        setProducts(Array.isArray(json?.data) ? json.data : []);
        setMeta(json?.meta || {});
      } catch (e) {
        // ignore abort
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [q, page, limit, brand, keyNow, keyInitial]);

  const totalPages = meta?.total_pages || meta?.lastPage || 1;

  return (
    <div className="flex w-full mx-auto flex-col justify-between xl:max-w-[1280px] lg:max-w-[1136px] lg:flex-row">
      {/* Sidebar Filter (desktop) */}
      <div className="hidden w-[300px] lg:w-[300px] pl-10 pr-2 py-6 lg:block">
        <Filter
          brands={brands}
          showBrandFilter={true}
          className="w-full py-24"
        />
      </div>

      <div className="flex-1 p-6">
        {/* Header + filter mobile (styling sama BestSeller) */}
        <div className="mb-6 flex flex-row gap-3 sm:flex-row sm:items-center">
          <h1 className="text-xl font-semibold">
            Hasil pencarian: <span className="font-bold">"{q || "-"}"</span>
          </h1>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="tertiary"
                className="ml-auto w-fit px-6 sm:w-auto lg:hidden"
              >
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[80vh] w-full flex-col overflow-y-auto overflow-x-hidden custom-scrollbar sm:max-w-[400px]">
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

        {/* Grid */}
        {loading ? (
          <ProductSkeletonGrid count={itemsPerPage} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <RegularCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="col-span-full text-center py-20 text-neutral-400">
            No products found.
          </p>
        )}

        {/* Pagination sederhana via URL (biar SSR/CSR tetap konsisten) */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-3">
            <button
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(sp.toString());
                next.set("page", String(Math.max(1, page - 1)));
                router.push(`/search?${next.toString()}`);
              }}
            >
              Prev
            </button>

            <div className="px-3 py-2 text-sm text-neutral-600">
              Page {page} / {totalPages}
            </div>

            <button
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => {
                const next = new URLSearchParams(sp.toString());
                next.set("page", String(Math.min(totalPages, page + 1)));
                router.push(`/search?${next.toString()}`);
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

