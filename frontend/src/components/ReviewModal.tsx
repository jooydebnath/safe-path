"use client";

import { Star, CheckCircle2, XCircle, X, Send, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Road } from "@/lib/data";

/** Star-rating + review form for a single road, with its existing reviews
 * listed below. Shared by the routes list and the map page's road lists so
 * both have a way to actually rate a road, not just look at one. */
export default function ReviewModal({ road, onClose }: { road: Road; onClose: () => void }) {
  const { reviews, addReview } = useStore();
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const roadReviews = reviews.filter((r) => r.roadId === road.id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified": return { icon: CheckCircle2, color: "bg-safe-soft text-safe", label: "Verified" };
      case "rejected": return { icon: XCircle, color: "bg-danger-soft text-danger", label: "Rejected" };
      default: return { icon: Clock, color: "bg-warning-soft text-warning", label: "Pending" };
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user || rating === 0) return;
    setError("");
    try {
      await addReview({ roadId: road.id, rating, comment: comment.trim() });
      setSubmitted(true);
      setRating(0);
      setComment("");
    } catch {
      setError("Couldn't submit your review — please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative sp-card rounded-t-3xl w-full max-w-[480px] p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{road.name}</h2>
            <p className="text-xs text-muted">{road.area}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-xl">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isAuthenticated ? (
          submitted ? (
            <div className="bg-safe-soft border border-border rounded-2xl p-3 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
              <p className="text-xs text-safe font-medium">Review submitted! It’ll show once an admin verifies it.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-4 mb-4 space-y-3 border border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Rate this road</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setRating(i + 1)}>
                    <Star className={`w-7 h-7 ${i < rating ? "fill-warning text-warning" : "text-border-strong"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (optional)..."
                className="w-full p-3 bg-surface-raised text-foreground placeholder:text-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20 border border-border"
              />
              {error && <p className="text-xs text-danger font-medium">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full sp-gradient-primary text-white py-3 rounded-xl font-bold text-sm shadow-[0_8px_24px_var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> Submit Review
              </button>
            </div>
          )
        ) : (
          <div className="bg-warning-soft border border-border rounded-2xl p-3 mb-4">
            <p className="text-xs text-warning font-medium">
              <Link href="/app/login" className="underline font-bold">Log in</Link> to rate and review this road.
            </p>
          </div>
        )}

        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Reviews ({roadReviews.length})</p>
        <div className="space-y-2">
          {roadReviews.length === 0 && <p className="text-xs text-muted py-4 text-center">No reviews yet — be the first.</p>}
          {roadReviews.map((rv) => {
            const badge = statusBadge(rv.status);
            const Icon = badge.icon;
            return (
              <div key={rv.id} className="bg-surface p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rv.rating ? "fill-warning text-warning" : "text-border-strong"}`} />
                    ))}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${badge.color}`}>
                    <Icon className="w-3 h-3" /> {badge.label}
                  </span>
                </div>
                {rv.comment && <p className="text-xs text-muted-strong mb-1">{rv.comment}</p>}
                <p className="text-[10px] text-muted">By {rv.userName}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
