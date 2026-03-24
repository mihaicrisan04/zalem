"use client";

import Link from "next/link";
import { Separator } from "@zalem/ui/components/optics/separator";
import { ModeToggle } from "./mode-toggle";

const footerLinks = {
  Shop: [
    { label: "All Products", href: "/" },
    { label: "Smartphones", href: "/categories/smartphones" },
    { label: "Laptops", href: "/categories/laptops" },
    { label: "Audio", href: "/categories/audio" },
    { label: "Fashion", href: "/categories/fashion" },
  ],
  Account: [
    { label: "My Orders", href: "/orders" },
    { label: "Favorites", href: "/favorites" },
    { label: "Cart", href: "/cart" },
  ],
  About: [
    { label: "About zalem", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function StoreFooter() {
  return (
    <footer className="bg-muted/40 mt-auto border-t">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* brand */}
          <div>
            <Link href="/" className="text-lg font-bold">
              zalem
            </Link>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Your AI-powered shopping assistant. Smarter recommendations, honest reviews, better
              decisions.
            </p>
            <div className="mt-4">
              <ModeToggle />
            </div>
          </div>

          {/* link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as any}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-2 text-xs sm:flex-row">
          <p>&copy; {new Date().getFullYear()} zalem. All rights reserved.</p>
          <p>Built with Convex, Next.js & Gemini</p>
        </div>
      </div>
    </footer>
  );
}
