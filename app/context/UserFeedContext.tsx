"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { mergeFeedItems } from "@/utils/merge-feed-items/mergeFeedItems";
import { FeedItem } from "@/types/user-feed";
import { getStatusSparks } from "@/utils/feed-item-actions/status-item-actions/sparkHandler";

interface FeedContextType {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh?: () => void;
  loadMore: () => void;
  prependItems?: (newItems: FeedItem[]) => void;
  removeItemByStatusId: (statusId: string) => void;
  updateActorAvatar: (userId: string, avatar: string) => void;
  updateTargetAvatar: (userId: string, avatar: string) => void;
  updateActorUsername: (userId: string, username: string) => void;
  updateTargetUsername: (userId: string, username: string) => void;
}

const FeedContext = createContext<FeedContextType>({
  items: [],
  loadMore: () => {},
  loading: false,
  hasMore: false,
  error: null,
  prependItems: () => {},
  removeItemByStatusId: () => {},
  updateActorAvatar: () => {},
  updateTargetAvatar: () => {},
  updateActorUsername: () => {},
  updateTargetUsername: () => {},
});

export function FeedProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);

  const prependItems = (incoming: FeedItem[]) => {
    setItems((prev) => mergeFeedItems(prev, incoming));
  };

  const removeItemByStatusId = (statusId: string) => {
    setItems((prev) =>
      prev.filter((item) => item.target?.status?.sourceId !== statusId),
    );
  };

  const updateActorAvatar = (userId: string, avatar: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (String(item.actor?.id) === String(userId)) {
          return {
            ...item,
            actor: { ...item.actor, avatar },
          };
        }
        return item;
      }),
    );
  };

  const updateTargetAvatar = (userId: string, avatar: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (String(item.target?.userId) === String(userId)) {
          return {
            ...item,
            target: { ...item.target, avatar },
          };
        }
        return item;
      }),
    );
  };

  const updateActorUsername = (userId: string, username: string) => {
    setItems((prev) =>
      prev.map((item) => {
        const isMatch = String(item.actor?.id) === String(userId);
        if (isMatch) {
          console.log("matched target item", item);
        }
        if (String(item.actor?.id) === String(userId)) {
          const updated = {
            ...item,
            actor: { ...item.actor, username },
          };

          console.log("before", item);
          console.log("after", updated);

          return updated;
        }

        return item;
      }),
    );
  };

  const updateTargetUsername = (userId: string, username: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (String(item.target?.userId) === String(userId)) {
          return {
            ...item,
            target: { ...item.target, username },
          };
        }
        return item;
      }),
    );
  };

  const fetchFeed = async (pageToFetch = 1, isRefresh = false) => {
    if (!session?.user?.id) return;

    const currentRequestId = ++requestIdRef.current; // bump ID for this fetch

    setLoading(true);

    try {
      const res = await fetch(
        `/api/users/${session.user.id}/user-feed?page=${pageToFetch}&limit=10`,
      );

      if (!res.ok) {
        throw new Error("Couldn't get feed results");
      }

      const data = await res.json();

      if (!data) {
        throw new Error("Feed data could not be retrieved");
      }

      // ❌ Ignore if a newer request has already started
      if (currentRequestId !== requestIdRef.current) return;

      if (isRefresh) {
        setItems((prev) =>
          Array.isArray(data.feed) && data.feed.length > 0 ? data.feed : prev,
        );
      } else {
        setItems((prev) =>
          Array.isArray(data.feed) ? [...prev, ...data.feed] : prev,
        );
      }

      setHasMore(data.pagination.hasNextPage);
      setError(null);
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError("Failed to load feed");
      }
      console.error(`Error loading: ${err}`);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchFeed(1, true);
    }
  }, [session?.user?.id]);

  const refresh = () => {
    setPage(1);
    fetchFeed(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  return (
    <FeedContext.Provider
      value={{
        items,
        loading,
        error,
        hasMore,
        refresh,
        loadMore,
        prependItems,
        removeItemByStatusId,
        updateActorAvatar,
        updateTargetAvatar,
        updateActorUsername,
        updateTargetUsername,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
};
