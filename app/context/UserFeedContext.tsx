"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
type FeedItem = {
  id: string;
  type:
    | "profile_updated"
    | "friend_accepted"
    | "joined_event"
    | "event_coming_up";
  actor: any;
  target: any;
  timestamp: string;
};

interface FeedContextType {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export function FeedProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async (pageToFetch = 1, isRefresh = false) => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/users/${session.user.id}/user-feed?page=${pageToFetch}&limit=10`
      );
      const data = await res.json();

      if (isRefresh) {
        setItems(data.feed);
      } else {
        setItems((prev) => [...prev, ...data.feed]);
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
      value={{ items, loading, error, hasMore, refresh, loadMore }}
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
