"use client";

import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@zalem/ui/components/optics/navigation-menu";

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
                    <ul className="w-52 p-1.5">
                      <li className="mb-1">
                        <NavigationMenuLink
                          href={`/categories/${category.slug}`}
                          className="text-foreground font-medium"
                        >
                          All {category.name}
                        </NavigationMenuLink>
                      </li>
                      {children.map((child: (typeof categories)[number]) => (
                        <li key={child._id}>
                          <NavigationMenuLink href={`/categories/${child.slug}`}>
                            {child.name}
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
