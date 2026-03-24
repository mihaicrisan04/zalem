"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Input } from "@zalem/ui/components/optics/input";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { ScrollArea } from "@zalem/ui/components/optics/scroll-area";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery(
    api.products.autocomplete,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip",
  );

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [query, router],
  );

  const showDropdown = isOpen && debouncedQuery.length >= 2;

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for products, brands, categories..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-lg border shadow-lg"
        >
          {results === undefined ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No products found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <ScrollArea className="h-auto max-h-80" viewportClassName="max-h-80" maskHeight={24}>
              <div>
                {results.map((product: (typeof results)[number]) => (
                  <Link
                    key={product._id}
                    href={`/products/${product._id}` as any}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="hover:bg-accent flex items-center gap-3 px-4 py-2.5"
                  >
                    <Image
                      src={product.image}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {product.price.toFixed(2)} lei
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
