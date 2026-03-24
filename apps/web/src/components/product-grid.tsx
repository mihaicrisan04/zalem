import { ProductCard, type ProductData } from "./product-card";

export function ProductGrid({
  products,
  favoritedIds = [],
}: {
  products: ProductData[];
  favoritedIds?: string[];
}) {
  if (products.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  const favSet = new Set(favoritedIds);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} isFavorited={favSet.has(product._id)} />
      ))}
    </div>
  );
}
