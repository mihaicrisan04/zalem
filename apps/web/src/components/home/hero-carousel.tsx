"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@zalem/ui/components/optics/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@zalem/ui/components/optics/carousel";

const slides = [
  {
    title: "Smart Tech,\nSmarter Prices",
    subtitle: "Up to 40% off on laptops, phones & audio gear",
    cta: "Shop electronics",
    href: "/categories/smartphones",
    image:
      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1400&h=700&fit=crop&q=80",
    align: "left" as const,
    overlay: "from-black/70 via-black/40 to-transparent",
  },
  {
    title: "Your Style,\nElevated",
    subtitle: "New season collections — clothing, shoes & accessories",
    cta: "Explore fashion",
    href: "/categories/fashion",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=700&fit=crop&q=80",
    align: "left" as const,
    overlay: "from-black/70 via-black/40 to-transparent",
  },
  {
    title: "Sound That\nMoves You",
    subtitle: "Premium headphones, speakers & earbuds",
    cta: "Browse audio",
    href: "/categories/audio",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=700&fit=crop&q=80",
    align: "right" as const,
    overlay: "from-transparent via-black/30 to-black/70",
  },
  {
    title: "Home &\nKitchen",
    subtitle: "Furniture, lighting & everything for your space",
    cta: "Shop home",
    href: "/categories/home-kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=700&fit=crop&q=80",
    align: "left" as const,
    overlay: "from-black/70 via-black/40 to-transparent",
  },
];

export function HeroCarousel() {
  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.title}>
            <div className="relative h-56 overflow-hidden rounded-xl sm:h-72 md:h-[360px] lg:h-[420px]">
              {/* background image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />

              {/* gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />

              {/* content */}
              <div
                className={`relative z-10 flex h-full flex-col justify-center px-8 sm:px-12 md:px-16 ${
                  slide.align === "right" ? "items-end text-right" : "items-start text-left"
                }`}
              >
                <h2 className="max-w-md text-2xl font-bold leading-tight tracking-tight whitespace-pre-line text-white sm:text-3xl md:text-4xl lg:text-5xl">
                  {slide.title}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-white/80 sm:mt-3 sm:text-base md:text-lg">
                  {slide.subtitle}
                </p>
                <Button
                  render={<Link href={slide.href as any} />}
                  nativeButton={false}
                  size="lg"
                  variant="secondary"
                  className="mt-4 gap-2 border-0 bg-white! text-sm font-semibold text-black! shadow-md hover:bg-white/90! sm:mt-6"
                >
                  {slide.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}
