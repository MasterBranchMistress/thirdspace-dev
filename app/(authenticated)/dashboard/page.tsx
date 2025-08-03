"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import { useFeed } from "@/app/context/UserFeedContext";

import { FeedBackground } from "@/components/background-animations/UserFeedBackground";
import LoadingPage from "@/components/spinner/LoadingPage";
import FeedItemCard from "@/components/feed-item-card/FeedItemCard";
import GreetingHeader from "@/components/feed-item-card/GreetingHeader";
import { Spinner } from "@heroui/react";
import EmptyFeedState from "@/components/empty-feed-state/EmptyFeedState";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { items, loading, error, hasMore, loadMore } = useFeed();

  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") return <LoadingPage />;
  if (error) return <p>{error}</p>;
  if (!items?.length && !loading)
    return <EmptyFeedState name={session?.user.firstName} />;

  return (
    <div>
      <FeedBackground />
      <div className="flex flex-col gap-4">
        <GreetingHeader />
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <div key={item.id} ref={isLast ? lastItemRef : null}>
              <FeedItemCard item={item} />
            </div>
          );
        })}
        {loading && <Spinner color="primary" variant="wave" />}
        {!hasMore && !loading && (
          <p className="text-xs text-center text-secondary">
            You’ve reached the end!
          </p>
        )}
      </div>
    </div>
  );
}
