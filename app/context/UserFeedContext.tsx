"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { mergeFeedItems } from "@/utils/merge-feed-items/mergeFeedItems";
import { FeedItem } from "@/types/user-feed";

interface FeedContextType {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh?: () => void;
  loadMore: () => void;
  prependItems?: (newItems: FeedItem[]) => void;
}

const FeedContext = createContext<FeedContextType>({
  items: [],
  loadMore: () => {},
  loading: false,
  hasMore: false,
  error: null,
  prependItems: () => {}, // <-- add this line
});

export function FeedProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const prependItems = (incoming: FeedItem[]) => {
    setItems((prev) => mergeFeedItems(prev, incoming));
  };

  const fetchFeed = async (pageToFetch = 1, isRefresh = false) => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/users/${session.user.id}/user-feed?page=${pageToFetch}&limit=10`
      );
      const data = await res.json();

      if (isRefresh) {
        setItems(data.feed); // Fresh load, no merge
      } else {
        setItems((prev) => mergeFeedItems(prev, data.feed));
      }

      setHasMore(data.pagination.hasNextPage);
      setError(null);
    } catch (err) {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
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
