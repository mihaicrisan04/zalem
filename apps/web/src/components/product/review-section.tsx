"use client";

import { useState, useMemo } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { MessageSquare, Pen, User } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { StarRating } from "@zalem/ui/components/optics/star-rating";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@zalem/ui/components/optics/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@zalem/ui/components/optics/pagination";
import { cn } from "@zalem/ui/lib/utils";

const REVIEWS_PER_PAGE = 5;

export function ReviewSection({ productId }: { productId: Id<"products"> }) {
  const aggregate = useQuery(api.reviews.getAggregateByProduct, { productId });
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.listByProduct,
    { productId },
    { initialNumItems: 50 },
  );
  const { isSignedIn } = useAuth();
  const createReview = useMutation(api.reviews.create);

  const [currentPage, setCurrentPage] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(results.length / REVIEWS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return results.slice(start, start + REVIEWS_PER_PAGE);
  }, [results, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page * REVIEWS_PER_PAGE > results.length && status === "CanLoadMore") {
      loadMore(50);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await createReview({ productId, rating: reviewRating, text: text.trim() });
      setText("");
      setReviewRating(5);
      setDialogOpen(false);
      setCurrentPage(1);
      toast.success("Review submitted");
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8">
      {/* aggregate rating + write button row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* aggregate */}
        {aggregate && aggregate.total > 0 && (
          <div className="grid max-w-md gap-6 sm:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border p-5">
              <span className="text-5xl font-bold tracking-tight">
                {aggregate.average.toFixed(1)}
              </span>
              <div className="mt-2">
                <StarRating defaultValue={Math.round(aggregate.average)} size="sm" disabled />
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                {aggregate.total} {aggregate.total === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = aggregate.distribution[star - 1];
                const pct = aggregate.total > 0 ? (count / aggregate.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5">
                    <span className="text-muted-foreground w-3 text-right text-xs">{star}</span>
                    <StarRating defaultValue={1} totalStars={1} size="sm" disabled />
                    <div className="bg-muted h-2 w-full max-w-32 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* write review dialog trigger */}
        {isSignedIn && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="lg" className="shrink-0 gap-2 text-sm">
                  <Pen className="size-4" />
                  Write a review
                </Button>
              }
            />
            <DialogPopup className="sm:max-w-md" animationPreset="bottomSlide">
              <DialogHeader>
                <DialogTitle>Write a review</DialogTitle>
                <DialogDescription>
                  Share your honest experience with this product.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-1">
                <div>
                  <p className="text-muted-foreground mb-3 text-sm">How would you rate it?</p>
                  <div className="flex justify-center">
                    <StarRating
                      defaultValue={reviewRating}
                      size="lg"
                      onRate={(star: number) => setReviewRating(star)}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Your review</p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What did you like or dislike? Would you recommend it?"
                    rows={4}
                    className="bg-background w-full rounded-lg border px-4 py-3 text-sm leading-relaxed focus:outline-none"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button variant="ghost" size="lg" className="text-sm">
                      Cancel
                    </Button>
                  }
                />
                <Button
                  size="lg"
                  className="text-sm"
                  disabled={isSubmitting || !text.trim()}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Submitting..." : "Submit review"}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        )}
      </div>

      <Separator />

      {/* review list */}
      {paginatedReviews.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          <MessageSquare className="mx-auto mb-3 size-10 opacity-30" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y">
          {paginatedReviews.map((review) => (
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
                  <div className="mt-1">
                    <StarRating defaultValue={review.rating} size="sm" disabled />
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
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pageNumbers.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {results.length > 0 && (
        <p className="text-muted-foreground text-center text-xs">
          Showing {(currentPage - 1) * REVIEWS_PER_PAGE + 1}–
          {Math.min(currentPage * REVIEWS_PER_PAGE, results.length)} of {results.length} reviews
        </p>
      )}
    </div>
  );
}
