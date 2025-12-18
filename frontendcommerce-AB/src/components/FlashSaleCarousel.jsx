import React from "react";
import { BevPick } from "@/data";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
  FlashSaleCard,
} from "@/components";

export function FlashSaleCarousel() {
  return (
    <Carousel className="w-full" opts={{ align: "start" }}>
      <CarouselContent className="justify-start md:gap-[52px] lg:gap-[59px] xl:gap-[111px]">
        {Array.isArray(BevPick) &&
          BevPick.slice(0, 9).map((b) => (
            <CarouselItem
              key={b.id}
              className="
                flex-none basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/6
              "
            >
              <FlashSaleCard item={b} />
            </CarouselItem>
          ))}
        <div className="flex-none w-[0px]" aria-hidden="true" />
      </CarouselContent>

      {/* Tombol navigasi carousel */}
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
