"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components";
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

  // wrapper responsif: tinggi mengikuti lebar
  const Wrapper = ({ children }) => (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-lg aspect-16/6">
        {children}
      </div>
    </div>
  );

  if (isloading) {
    return (
      <Wrapper>
        <Skeleton className="absolute inset-0 w-full h-full" />
      </Wrapper>
    );
  }

  if (!banners.length) return null;

  return (
    <Wrapper>
      <Carousel
        className="absolute inset-0 w-full h-full"
        opts={{ loop: true }}
        plugins={[autoplay.current]}
        onMouseEnter={() => autoplay.current.stop()}
        onMouseLeave={() => autoplay.current.reset()}
      >
        <CarouselContent className="h-full">
          {banners.map((b, idx) => {
            const src = getImageUrl(b.image_url || b.image);
            return (
              <CarouselItem key={b.id || idx} className="h-full">
                <img
                  src={src}
                  alt={b.title || "Banner"}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://res.cloudinary.com/abbymedia/image/upload/v1766202017/placeholder.png")
                  }
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
        <CarouselIndicators />
      </Carousel>
    </Wrapper>
  );
}
