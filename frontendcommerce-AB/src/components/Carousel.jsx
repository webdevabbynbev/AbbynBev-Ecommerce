"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { BtnIcon } from "@/components";

import { cn } from "@/lib/utils";

const CarouselContext = React.createContext(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      { ...opts, axis: orientation === "horizontal" ? "x" : "y" },
      plugins
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    // ✅ NEW: state buat indikator
    const [scrollSnaps, setScrollSnaps] = React.useState([]); // [] supaya .length aman
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const onSelect = React.useCallback((embla) => {
      if (!embla) return;
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
      setSelectedIndex(embla.selectedScrollSnap()); // ✅ track slide aktif
    }, []);

    const onReInit = React.useCallback((embla) => {
      if (!embla) return;
      setScrollSnaps(embla.scrollSnapList()); // ✅ refresh daftar snaps
      setSelectedIndex(embla.selectedScrollSnap());
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
    const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

    // ✅ NEW: expose helper untuk pindah ke index tertentu (dipakai indikator)
    const scrollTo = React.useCallback((idx) => api?.scrollTo(idx), [api]);

    const handleKeyDown = React.useCallback(
      (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext]
    );

    React.useEffect(() => {
      if (api && setApi) setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) return;

      // inisialisasi awal
      setScrollSnaps(api.scrollSnapList());
      onReInit(api);
      onSelect(api);

      api.on("reInit", onReInit);
      api.on("select", onSelect);

      return () => {
        api.off("reInit", onReInit);
        api.off("select", onSelect);
      };
    }, [api, onSelect, onReInit]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          scrollTo, // ✅
          canScrollPrev,
          canScrollNext,
          scrollSnaps, // ✅
          selectedIndex, // ✅
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <BtnIcon
        iconName="ArrowLeft"
        variant="primary"
        size="xs"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-left-3 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
      />
    );
  }
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <BtnIcon
        iconName="ArrowRight"
        variant="primary"
        size="xs"
        disabled={!canScrollNext}
        onClick={scrollNext}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-3 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
      />
    );
  }
);
CarouselNext.displayName = "CarouselNext";

const CarouselIndicators = React.forwardRef(({ className }, ref) => {
  const { scrollSnaps, selectedIndex, scrollTo } = useCarousel();

  if (!scrollSnaps.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-8 left-0 right-0 flex justify-center gap-2",
        className
      )}
    >
      {scrollSnaps.map((_, idx) => (
        <button
          key={idx}
          onClick={() => scrollTo(idx)}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-200",
            selectedIndex === idx
              ? "bg-primary-700 scale-115"
              : "bg-white border-1 border-primary-700 hover:bg-primary-400"
          )}
          aria-label={`Go to slide ${idx + 1}`}
        />
      ))}
    </div>
  );
});
CarouselIndicators.displayName = "CarouselIndicators";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
};
