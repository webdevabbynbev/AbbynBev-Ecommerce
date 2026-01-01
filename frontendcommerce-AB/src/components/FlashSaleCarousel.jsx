"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
  FlashSaleCard,
} from "@/components";
import { getProducts } from "@/services/api/product.services";

export function FlashSaleCarousel() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setLoading(true);

        const res = await getProducts({ is_flash_sale: 1 });
        setProducts(res.data || []);
      } catch (error) {
        console.error("Gagal memuat Flash Sale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Loading Flash Sale...</p>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <Carousel className="w-full" opts={{ align: "start" }}>
      <CarouselContent className="justify-start snap-start gap-0">
        {products.slice(0, 10).map((product) => (
          <CarouselItem
            key={product.id}
            className="flex-none basis-1/2 md:basis-1/4 lg:basis-1/3"
          >
            <FlashSaleCard item={product} />
          </CarouselItem>
        ))}
        <div className="flex-none w-[0px]" aria-hidden="true" />
      </CarouselContent>

      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}