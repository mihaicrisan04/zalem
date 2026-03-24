"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@zalem/ui/components/optics/theme-switcher";

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
  const { theme, setTheme } = useTheme();

  return (
    <footer className="relative mt-auto overflow-hidden border-t bg-gradient-to-b from-transparent to-black/[0.02] dark:to-white/[0.02]">
      {/* giant background wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none items-end justify-center overflow-hidden"
      >
        <span className="text-foreground/[0.03] translate-y-[30%] text-[clamp(16rem,32vw,30rem)] font-black leading-none tracking-tighter">
          zalem
        </span>
        {/* fade gradient over the wordmark — darker toward bottom */}
        <div className="from-background via-background/80 absolute inset-0 bg-gradient-to-b via-40% to-transparent" />
      </div>

      {/* content */}
      <div className="relative z-10 container mx-auto px-4 pt-14 pb-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {/* brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              <span className="text-lg font-bold tracking-tight">zalem</span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-[240px] text-[13px] leading-relaxed">
              Your AI-powered shopping assistant. Smarter recommendations, honest reviews, better
              decisions.
            </p>
            <div className="mt-5 w-fit">
              <ThemeSwitcher value={theme} onChange={setTheme} />
            </div>
          </div>

          {/* link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-foreground/80 mb-3.5 text-xs font-semibold uppercase tracking-widest">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as any}
                      className="text-muted-foreground hover:text-foreground text-[13px] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="text-muted-foreground mt-12 flex flex-col items-center justify-between gap-2 text-[11px] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} zalem. All rights reserved.</p>
          <p>Built with Convex, Next.js & Gemini</p>
        </div>
      </div>
    </footer>
  );
}
