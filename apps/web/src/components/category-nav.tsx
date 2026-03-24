"use client";

import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Home,
  Shirt,
  Sparkles,
  Bike,
  ChevronRight,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@zalem/ui/components/optics/navigation-menu";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Home,
  Shirt,
  Sparkles,
  Bike,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Smartphones: "Latest phones, cases & accessories",
  Laptops: "Gaming, ultrabooks & laptop gear",
  Tablets: "iPads, Android tablets & more",
  Audio: "Headphones, speakers & earbuds",
  "Home & Kitchen": "Furniture, lighting & kitchen essentials",
  Fashion: "Clothing, shoes, watches & sunglasses",
  Beauty: "Skincare, fragrances & cosmetics",
  "Sports & Auto": "Sports gear, automotive & motorcycle",
};

const SUB_DESCRIPTIONS: Record<string, string> = {
  "Android Phones": "Samsung, Pixel & more Android devices",
  iPhones: "Apple's latest iPhone lineup",
  "Phone Cases": "Protection & style for every phone",
  "Gaming Laptops": "High-performance laptops for gamers",
  Ultrabooks: "Thin, light & powerful laptops",
  "Laptop Accessories": "Stands, bags, mice & more",
  iPads: "Apple iPad, Air, Pro & Mini",
  "Android Tablets": "Samsung Galaxy Tab & more",
  Headphones: "Over-ear & on-ear headphones",
  Speakers: "Bluetooth & smart speakers",
  Earbuds: "True wireless & in-ear earbuds",
  Furniture: "Tables, chairs, shelves & storage",
  Kitchen: "Cookware, tools & appliances",
  Lighting: "Lamps, smart lights & fixtures",
  Decoration: "Art, plants & home accents",
  "Men's Clothing": "Shirts, jackets & essentials",
  "Women's Clothing": "Dresses, tops & outerwear",
  Shoes: "Sneakers, boots & sandals",
  Watches: "Smart & analog watches",
  Sunglasses: "Designer & sport sunglasses",
  Skincare: "Cleansers, moisturizers & serums",
  Fragrances: "Perfumes & colognes",
  "Sports Equipment": "Training gear & accessories",
  Automotive: "Car accessories & tools",
  Motorcycle: "Helmets, gear & parts",
};

export function CategoryNav() {
  const categories = useQuery(api.categories.list);

  if (!categories) return null;

  const topLevel = categories.filter((c: (typeof categories)[number]) => !c.parentId);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-1">
        <NavigationMenu viewport={null}>
          <NavigationMenuList className="flex-wrap justify-start gap-0">
            {topLevel.map((category: (typeof categories)[number]) => {
              const children = categories.filter(
                (c: (typeof categories)[number]) => c.parentId === category._id,
              );
              const IconComponent = CATEGORY_ICONS[category.icon ?? ""] ?? Sparkles;
              const description = CATEGORY_DESCRIPTIONS[category.name] ?? "";

              if (children.length === 0) {
                return (
                  <NavigationMenuItem key={category._id}>
                    <NavigationMenuLink href={`/categories/${category.slug}`}>
                      {category.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              }

              return (
                <NavigationMenuItem key={category._id}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-3 md:w-[460px] lg:w-[560px] lg:grid-cols-[.8fr_1fr]">
                      {/* hero card */}
                      <li className="row-span-4">
                        <NavigationMenuLink
                          href={`/categories/${category.slug}`}
                          className="from-muted/60 to-muted flex h-full w-full flex-col justify-end rounded-lg bg-gradient-to-b p-5 no-underline outline-none transition-all duration-200 select-none hover:shadow-md"
                        >
                          <IconComponent className="text-foreground/70 mb-3 size-8" />
                          <div className="text-base font-semibold">{category.name}</div>
                          <p className="text-muted-foreground mt-1 text-[13px] leading-snug">
                            {description}
                          </p>
                          <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
                            Browse all <ChevronRight className="size-3" />
                          </span>
                        </NavigationMenuLink>
                      </li>

                      {/* subcategory links */}
                      {children.map((child: (typeof categories)[number]) => (
                        <li key={child._id}>
                          <NavigationMenuLink
                            href={`/categories/${child.slug}`}
                            className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors"
                          >
                            <div className="text-sm leading-none font-medium">{child.name}</div>
                            <p className="text-muted-foreground line-clamp-2 text-[13px] leading-snug">
                              {SUB_DESCRIPTIONS[child.name] ?? ""}
                            </p>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
