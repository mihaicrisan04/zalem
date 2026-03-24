"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { MessageSquare, Star, User } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { cn } from "@zalem/ui/lib/utils";

export function ReviewSection({ productId }: { productId: Id<"products"> }) {
  const aggregate = useQuery(api.reviews.getAggregateByProduct, { productId });
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.listByProduct,
    { productId },
    { initialNumItems: 5 },
  );
  const { isSignedIn } = useAuth();
  const createReview = useMutation(api.reviews.create);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await createReview({ productId, rating, text: text.trim() });
      setText("");
      setRating(5);
      setShowForm(false);
      toast.success("Review submitted");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* aggregate rating — side by side */}
      {aggregate && aggregate.total > 0 && (
        <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
          {/* big rating number */}
          <div className="flex flex-col items-center justify-center rounded-xl border p-6">
            <span className="text-5xl font-bold tracking-tight">
              {aggregate.average.toFixed(1)}
            </span>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "size-4",
                    star <= Math.round(aggregate.average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted fill-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {aggregate.total} {aggregate.total === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* distribution bars */}
          <div className="flex flex-col justify-center gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = aggregate.distribution[star - 1];
              const pct = aggregate.total > 0 ? (count / aggregate.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-6 text-right text-sm">{star}</span>
                  <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                  <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-right text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* write review button / form */}
      {isSignedIn && (
        <div>
          {!showForm ? (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-sm"
              onClick={() => setShowForm(true)}
            >
              <MessageSquare className="size-4" />
              Write a review
            </Button>
          ) : (
            <div className="rounded-xl border p-5">
              <h3 className="mb-4 font-semibold">Write a review</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Your rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "size-7",
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted fill-muted",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What did you think of this product? What did you like or dislike?"
                  rows={4}
                  className="bg-background w-full rounded-lg border px-4 py-3 text-sm leading-relaxed"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="text-sm"
                    disabled={isSubmitting || !text.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Submit review"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="text-sm"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* review list */}
      {results.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          <MessageSquare className="mx-auto mb-3 size-10 opacity-30" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y">
          {results.map((review) => (
            <div key={review._id} className="py-5 first:pt-0">
              <div className="flex items-start gap-3">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                  <User className="text-muted-foreground size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{review.userName}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "size-3.5",
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted fill-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {review.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" className="text-sm" onClick={() => loadMore(5)}>
            Show more reviews
          </Button>
        </div>
      )}

      {status === "Exhausted" && results.length > 0 && (
        <p className="text-muted-foreground text-center text-xs">
          Showing all {results.length} reviews
        </p>
      )}
    </div>
  );
}
