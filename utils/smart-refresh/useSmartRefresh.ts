import { FeedItem } from "@/types/user-feed";
import { useEffect, useRef, useState } from "react";
import { mergeFeedItems } from "../merge-feed-items/mergeFeedItems";

export function useSmartFeedRefresh({
  userId,
  feedItems,
  setFeedItems,
  fetchUrl = `/api/users/${userId}/user-feed`,
  interval = 60000,
}: {
  userId: string;
  feedItems: FeedItem[];
  setFeedItems?: (items: FeedItem[]) => void;
  fetchUrl?: string;
  interval?: number;
}) {
  const [newItems, setNewItems] = useState<FeedItem[]>([]);

  // Refs to always hold latest values without retriggering useEffect
  const feedItemsRef = useRef(feedItems);
  const lastTimestampRef = useRef(feedItems[0]?.timestamp);

  useEffect(() => {
    feedItemsRef.current = feedItems;
    lastTimestampRef.current = feedItems[0]?.timestamp;
  }, [feedItems]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        if (feedItemsRef.current.length === 0 || !lastTimestampRef.current) {
          setNewItems([]);
          return;
        }

        const since = encodeURIComponent(lastTimestampRef.current || "");
        const res = await fetch(`${fetchUrl}?since=${since}`);
        const data = await res.json();

        if (data?.feed?.length > 0) {
          const existingIds = new Set(
            feedItemsRef.current.map((item) => item.id?.toString())
          );

          const uniqueNewItems = data.feed.filter(
            (item: FeedItem) => !existingIds.has(item.id?.toString())
          );

          setNewItems(uniqueNewItems.length > 0 ? uniqueNewItems : []);
        } else {
          setNewItems([]);
        }
      } catch (err) {
        console.error("Error checking for feed updates:", err);
      }
    }, interval);

    return () => clearInterval(refreshInterval);
  }, [userId, fetchUrl, interval]); // ❌ no feedItems here

  const applyNewItems = () => {
    if (setFeedItems && newItems.length > 0) {
      const merged = mergeFeedItems(feedItemsRef.current, newItems);

      setFeedItems(merged);
      setNewItems([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    newItems,
    applyNewItems,
  };
}
