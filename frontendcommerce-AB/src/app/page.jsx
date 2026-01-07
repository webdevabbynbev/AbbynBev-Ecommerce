"use client";

console.log("ENV CLOUD:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
import { useState, useEffect } from "react";
// Tambahkan useSearchParams
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
// Import Toast (Pastikan path import ini sesuai dengan lokasi komponen Sonner kamu)
import { toast } from "sonner";

import {
  RegularCardSkeleton,
  RegularCard,
  CategoryCard,
  Button,
  HeroCarousel,
  BrandCard,
  FlashSaleCarousel,
} from "@/components";
import { DataCategoryCard, DataBrand } from "@/data";
import { getProducts } from "@/services/api/product.services";
import { getCategories } from "@/services/api/category.services";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams(); // Hook untuk baca URL

  // --- LOGIC BARU: CEK SESSION EXPIRED ---
  useEffect(() => {
    const isExpired = searchParams.get("session_expired");
    if (isExpired) {
      // 1. Munculkan Popup/Toast
      toast.error("Sesi Berakhir", {
        description: "Waktu login Anda habis. Silakan login kembali.",
        duration: 5000,
        action: {
          label: "Login",
          onClick: () => router.push("/sign-in"), // Sesuaikan rute login kamu
        },
      });

      // 2. Bersihkan URL (Hapus ?session_expired=true biar bersih)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, router]);
  // ---------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await getCategories();

        const arr = Array.isArray(res?.serve)
          ? res.serve
          : Array.isArray(res?.serve?.data)
          ? res.serve.data
          : [];

        const level1 = arr.filter(
          (c) => c.level === 1 && (c.parentId == null || c.parent_id == null)
        );

        setCategories(level1);
      } catch (err) {
        console.error("getCategories error:", err);
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProducts({ page: 1, per_page: 50 });
        setProducts(data);
      } catch (err) {
        console.error("getProducts error:", err);
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  const PickSection = ({
    title,
    subtitle,
    items = [],
    loading = false,
    onSeeAll,
    maxItems = 12,
    skeletonCount = 12,
    titleClassName = "text-4xl",
  }) => {
    if (!loading && (!items || items.length === 0)) return null;

    return (
      <div className="xl:max-w-7xl lg:max-w-240 mx-auto px-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-row space-y-1">
            <h3
              className={`font-damion font-normal ${titleClassName} text-primary-700`}
            >
              {title}
            </h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <Button variant="secondary" size="md" onClick={onSeeAll}>
            See all
          </Button>
        </div>

        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <RegularCardSkeleton key={`pick-skel-${i}`} />
              ))}
            </div>

            <div className="hidden lg:grid grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <RegularCardSkeleton key={`pick-skel-${i}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:hidden gap-4">
              {items.slice(0, maxItems).map((p) => (
                <RegularCard
                  key={p.id ?? p._id ?? p.slug ?? p.name}
                  product={p}
                />
              ))}
            </div>

            <div className="hidden lg:grid grid-cols-5 gap-4">
              {items.slice(0, 10).map((p) => (
                <RegularCard
                  key={p.id ?? p._id ?? p.slug ?? p.name}
                  product={p}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const abbyPicks = products.slice(0, 12);
  const bevPicks = products.slice(12, 24);

  return (
    <div className="Container items-center justify-center mx-auto overflow-visible">
      <div className="Hero-wrapper w-full flex flex-row py-0 lg:py-6 justify-between h-full mx-auto xl:max-w-7xl lg:max-w-240">
        <div className="h-auto w-full px-0 lg:px-6 items-center">
          <HeroCarousel />
        </div>
      </div>

      <div className="ContainerCategory p-6 space-y-4 mx-auto w-full xl:max-w-7xl lg:max-w-240 overflow-hidden">
        <h3 className="text-primary-700 text-lg font-bold">Kategori</h3>
        <div className="w-full">
          <div
            className="
      flex gap-3
      overflow-x-auto
      no-scrollbar
      pb-2
      px-6
      snap-x snap-mandatory
      scroll-smooth
      lg:mx-0 lg:px-0
      lg:grid md:grid-cols-8 lg:grid-cols-8 lg:gap-6 lg:overflow-visible justify-between
    "
          >
            {categories.map((item) => (
              <div key={item.id} className="shrink-0 snap-start">
                <CategoryCard {...item} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ContainerFlashSale w-full flex-col bg-primary-100 items-center justify-center bg-[url('/Logo_SVG_AB.svg')] bg-no-repeat bg-center">
        <div className="Wrapper p-6 flex flex-col xl:max-w-7xl lg:max-w-240 mx-auto">
          <div className="leftWrapper justify-between flex flex-row w-full space-y-6">
            <div className="texts flex-row">
              <h3 className="font-damion text-3xl text-primary-700">
                Flash Sale
              </h3>
            </div>
            <div className="">
              <Button variant="primary" size="sm">
                Lihat semua
              </Button>
            </div>
          </div>
          <div className="w-full">
            <FlashSaleCarousel />
          </div>
        </div>
      </div>

      <div className="ContainerAbbyBev py-10 space-y-16 w-full">
        <PickSection
          title="Abby's Pick"
          subtitle="Your Makeup Matchmaker"
          items={abbyPicks}
          loading={productsLoading}
          onSeeAll={() => router.push("/products?pick=abby")}
          titleClassName="text-3xl"
        />

        <PickSection
          title="Bev's Pick"
          subtitle="Your skinCare Bestie"
          items={bevPicks}
          loading={productsLoading}
          onSeeAll={() => router.push("/products?pick=bev")}
          titleClassName="text-3xl"
        />
      </div>

      <div className="Brand-Container flex px-10 py-10 bg-primary-100 items-center justify-center space-x-6 bg-[url('/Logo_SVG_AB.svg')] bg-no-repeat bg-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:max-w-7xl lg:max-w-240 mx-auto gap-6">
          <div className="Wrapper flex-row w-full space-y-6">
            <h3 className="font-damion text-3xl text-primary-700">
              Shop by brands
            </h3>
            <div className="hidden flex-row text-lg font-medium space-y-6 lg:block">
              <p>
                From best-sellers to hidden gems — explore top beauty brands,
                handpicked by Abby n Bev.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/brand")}
              >
                Discover more
              </Button>
            </div>
          </div>

          <div className="Conten-wrapper grid grid-cols-2 md:grid-cols-4 gap-6 min-w-[50%] max-w-384 mx-auto">
            {DataBrand.slice(0, 8).map((item) => (
              <BrandCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

console.log("Home render OK");
