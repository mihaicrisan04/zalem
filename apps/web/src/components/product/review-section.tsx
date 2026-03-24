"use client";

import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";

export function ReviewSection({ productId }: { productId: Id<"products"> }) {
  const aggregate = useQuery(api.reviews.getAggregateByProduct, { productId });
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.listByProduct,
    { productId },
    { initialNumItems: 10 },
  );
  const { isSignedIn } = useAuth();
  const createReview = useMutation(api.reviews.create);

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await createReview({ productId, rating, text: text.trim() });
      setText("");
      setRating(5);
      toast.success("Review submitted");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* aggregate rating */}
      {aggregate && (
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold">{aggregate.average.toFixed(1)}</p>
            <p className="text-yellow-500">{"★".repeat(Math.round(aggregate.average))}</p>
            <p className="text-muted-foreground text-sm">{aggregate.total} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = aggregate.distribution[star - 1];
              const pct = aggregate.total > 0 ? (count / aggregate.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{star}★</span>
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-yellow-500 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* write review form */}
      {isSignedIn && (
        <>
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="text-sm font-semibold">Write a review</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? "text-yellow-500" : "text-muted"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
            <Button type="submit" size="sm" disabled={isSubmitting || !text.trim()}>
              {isSubmitting ? "Submitting..." : "Submit review"}
            </Button>
          </form>
        </>
      )}

      <Separator />

      {/* review list */}
      <div className="space-y-4">
        {results.map((review) => (
          <div key={review._id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{review.userName}</span>
              <span className="text-yellow-500 text-sm">{"★".repeat(review.rating)}</span>
              <span className="text-muted-foreground text-xs">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{review.text}</p>
          </div>
        ))}
      </div>

      {status === "CanLoadMore" && (
        <Button variant="outline" size="sm" onClick={() => loadMore(10)}>
          Load more reviews
        </Button>
      )}
    </div>
  );
}
