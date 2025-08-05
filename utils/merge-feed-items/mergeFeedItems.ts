// utils/mergeFeedItems.ts
import { FeedItem } from "@/types/user-feed";

/**
 * Merge two arrays of FeedItem, dedupe by `id`, and sort newest → oldest by timestamp.
 * @param current - The existing feed items in state
 * @param incoming - The new feed items to merge in
 */
export function mergeFeedItems(
  current: FeedItem[],
  incoming: FeedItem[]
): FeedItem[] {
  const map = new Map<string, FeedItem>();

  // Add current first (so incoming can override if needed)
  for (const item of current) {
    if (item?.id) {
      map.set(item.id.toString(), item);
    }
  }

  // Add/replace with incoming
  for (const item of incoming) {
    if (item?.id) {
      map.set(item.id.toString(), item);
    }
  }

  // Convert back to array and sort newest first
  return Array.from(map.values()).sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA;
  });
}
