import { FeedItem } from "@/types/user-feed";
import { useEffect, useRef, useState } from "react";
import { mergeFeedItems } from "../merge-feed-items/mergeFeedItems";

export function useSmartFeedRefresh({
  userId,
  feedItems,
  setFeedItems,
  fetchUrl = `/api/users/${userId}/user-feed`,
}: {
  userId: string;
  feedItems: FeedItem[];
  setFeedItems?: (items: FeedItem[]) => void;
  fetchUrl?: string;
}) {
  const [newItems, setNewItems] = useState<FeedItem[]>([]);
  const [hasNewItems, setHasNewItems] = useState(false);

  const feedItemsRef = useRef(feedItems);
  const lastTimestampRef = useRef<string | Date | undefined>(
    feedItems[0]?.timestamp,
  );
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    feedItemsRef.current = feedItems;
    lastTimestampRef.current = feedItems[0]?.timestamp;
  }, [feedItems]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const getPollDelay = () => {
      const secondsSinceMount = (Date.now() - mountedAtRef.current) / 1000;
      const isHidden = document.hidden;

      if (isHidden) return 60000; // 60s when tab hidden
      if (secondsSinceMount < 30) return 5000; // 5s for first 30s
      return 10000; // 10s normally
    };

    const checkForUpdates = async () => {
      try {
        if (
          feedItemsRef.current.length === 0 ||
          !lastTimestampRef.current ||
          cancelled
        ) {
          setNewItems([]);
          setHasNewItems(false);
          return;
        }

        const since = encodeURIComponent(
          new Date(lastTimestampRef.current ?? Date.now()).toISOString(),
        );

        const res = await fetch(`${fetchUrl}?since=${since}`);
        const data = await res.json();

        if (cancelled) return;

        if (data?.feed?.length > 0) {
          const existingIds = new Set(
            feedItemsRef.current.map((item) => item.id?.toString()),
          );

          setNewItems((prev) => {
            const prevIds = new Set(prev.map((item) => item.id?.toString()));

            const uniqueIncoming = data.feed.filter(
              (item: FeedItem) =>
                !existingIds.has(item.id?.toString()) &&
                !prevIds.has(item.id?.toString()),
            );

            const merged = [...prev, ...uniqueIncoming];
            setHasNewItems(merged.length > 0);
            return merged;
          });
        } else {
          setHasNewItems((prev) => (newItems.length > 0 ? prev : false));
        }
      } catch (err) {
        console.error("Error checking for feed updates:", err);
      } finally {
        if (!cancelled) {
          pollTimeoutRef.current = setTimeout(checkForUpdates, getPollDelay());
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        checkForUpdates(); // immediate check when tab becomes visible again
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    checkForUpdates();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [userId, fetchUrl]);

  const applyNewItems = () => {
    if (setFeedItems && newItems.length > 0) {
      const merged = mergeFeedItems(feedItemsRef.current, newItems);
      setFeedItems(merged);
      setNewItems([]);
      setHasNewItems(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    newItems,
    newItemCount: newItems.length,
    hasNewItems,
    applyNewItems,
  };
}
