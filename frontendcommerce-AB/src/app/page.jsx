"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  PickCarousel,
  CategoryCard,
  Button,
  HeroCarousel,
  BrandCard,
  FlashSaleCarousel,
} from "@/components";
import { DataCategoryCard, DataBrand } from "@/data";
import { getProducts } from "@/services/api/product.services";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProducts({ page: 1, per_page: 50 });
        setProducts(data); // ✅ langsung pakai data hasil normalizeProduct
      } catch (err) {
        console.error("getProducts error:", err);
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="Container items-center justify-center mx-auto overflow-visible">
      <div className="Hero-wrapper w-full flex flex-row py-0 lg:py-6 justify-between h-full mx-auto xl:max-w-[1280px] lg:max-w-[960px]">
        <div className="h-auto w-full px-0 lg:px-6 items-center">
          <HeroCarousel />
        </div>
      </div>

      <div className="ContainerCategory p-6 space-y-4 mx-auto w-full xl:max-w-[1280px] lg:max-w-[960px] overflow-hidden">
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
            {DataCategoryCard.map((item) => (
              <div key={item.id} className="shrink-0 snap-start">
                <CategoryCard {...item} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ContainerFlashSale w-full flex-col bg-primary-100 items-center justify-center bg-[url('/Logo_SVG_AB.svg')] bg-no-repeat bg-center">
        <div className="Wrapper p-6 flex flex-col md:items-center lg:items-center md:flex-row lg:flex-row  xl:max-w-[1280px] lg:max-w-[960px] mx-auto">
          <div className="leftWrapper justify-between flex sm:flex-col w-full sm:w-full space-y-6  md:items-start sm:items-center ">
            <div className="texts flex-row">
              <h3 className="font-damion text-3xl text-primary-700">
                Flash Sale
              </h3>
              <p className="hidden md:block lg:block text-md ">
                Your Favorite Beauty Essentials, Now at Irresistible Prices
                Limited Time Only — While Stock Lasts!
              </p>
            </div>
            <div className="md:block lg:block">
              <Button variant="primary" size="sm">
                See all
              </Button>
            </div>
          </div>
          <div className="md:w-[50%] sm:w-full">
            <FlashSaleCarousel />
          </div>
        </div>
      </div>

      <div className="ContainerAbbyBev py-10 space-y-16 w-full">
        <div className="xl:max-w-[1280px] lg:max-w-[960px] mx-auto rounded-[40px] bg-primary-50 wrapper flex-row space-y-6 p-6 outline-1 outline-primary-300">
          <div className="flex items-start justify-between">
            <div className="flex-row space-y-1">
              <h3 className="font-damion font-normal text-4xl text-primary-700">
                Abby's Pick
              </h3>
              <p>Your Makeup Matchmaker</p>
            </div>
            <Button variant="secondary" size="md">
              See all
            </Button>
          </div>
          <PickCarousel />
          {/* <Carousel
            SlidesPerView={5}
            products={BevPick}
            CardComponent={RegularCard}
          /> */}
        </div>

        <div className="xl:max-w-[1280px] lg:max-w-[960px] mx-auto rounded-[40px] bg-primary-50 wrapper flex-row space-y-6 p-6 outline-1 outline-primary-300">
          <div className="flex items-start justify-between">
            <div className="flex-row space-y-1  items-center justify-center">
              <h3 className="font-damion font-normal text-2xl text-primary-700">
                Bev's Pick
              </h3>
              <p>Your skinCare Bestie</p>
            </div>
            <Button variant="secondary" size="md">
              See all
            </Button>
          </div>
          <PickCarousel />
        </div>
      </div>

      <div className="Brand-Container flex px-10 py-10 bg-primary-100 items-center justify-center space-x-6 bg-[url('/Logo_SVG_AB.svg')] bg-no-repeat bg-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:max-w-[1280px] lg:max-w-[960px] mx-auto gap-6">
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

          <div className="Conten-wrapper grid grid-cols-2 md:grid-cols-4 gap-6 min-w-[50%] max-w-[1536px] mx-auto">
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
