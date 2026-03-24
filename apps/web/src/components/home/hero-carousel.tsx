"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@zalem/ui/components/optics/carousel";

const banners = [
  {
    title: "Summer Tech Deals",
    subtitle: "Up to 40% off on electronics",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    title: "New Arrivals",
    subtitle: "Discover the latest products",
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    title: "Free Shipping",
    subtitle: "On all orders over 200 lei",
    gradient: "from-orange-500 to-red-600",
  },
];

export function HeroCarousel() {
  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.title}>
            <div
              className={`bg-gradient-to-r ${banner.gradient} flex h-48 items-center justify-center rounded-lg text-white sm:h-64 md:h-80`}
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">{banner.title}</h2>
                <p className="mt-2 text-lg opacity-90">{banner.subtitle}</p>
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
