import React from "react";
import { BevPick } from "@/data";
import {
  RegularCard,
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
} from "@/components";

export function PickCarousel() {
  return (
    <Carousel className="w-full" opts={{ align: "start" }}>
        <CarouselContent className="justify-start">
        {Array.isArray(BevPick) &&
          BevPick.slice(0, 9).map((b) => ( 
          <CarouselItem
          key={b.id}
          className="flex-none basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/4 xl:basis-1/6 snap-start" >
          <RegularCard item={b} />
          </CarouselItem>
          
        ))}
        
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
