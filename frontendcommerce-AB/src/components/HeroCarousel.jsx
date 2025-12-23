"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselIndicators,
} from "@/components";
import { getImageUrl } from "@/utils/getImageUrl";
import { getBanners } from "@/services/api/banners";

export function HeroCarousel() {
  const autoplay = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  const [isloading, setLoading] = useState(true);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const resData = await getBanners();
        const serve = resData?.serve;
        const normalized = Array.isArray(serve) ? serve : serve?.data || [];
        setBanners(normalized);
      } catch (e) {
        console.error("gagal fetch banner", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (isloading || !banners.length) {
    // 🔹 SKELETON VIEW
    return (
      <div className="w-full h-[300px]">
        <div className="flex">
          <div className="w-full h-full">
            <Skeleton className="w-full h-[300px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Carousel
        className="w-full h-full"
        opts={{ loop: true }}
        plugins={[autoplay.current]}
        onMouseEnter={() => autoplay.current.stop()}
        onMouseLeave={() => autoplay.current.reset()}
      >
        <CarouselContent>
          {banners.map((b, idx) => {
            const src = getImageUrl(b.image_url || b.image);
            return (
              <CarouselItem key={b.id || idx}>
                <div className="relative h-[300px]">
                  <img
                    src={src}
                    alt={b.title || "Banner"}
                    className="rounded-lg w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Default Controls */}
        <CarouselPrevious />
        <CarouselNext />
        <CarouselIndicators/>
      </Carousel>
    </div>
  );
}
