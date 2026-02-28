import { SessionUser } from "@/types/user-session";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { FeedItemType } from "@/types/user-feed";

export type EventData = {
  _id: string;
  sourceId: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments: any[];
  sparks: number;
  views: number;
};

export const getEventInfo = async (
  loggedInUser?: SessionUser,
  eventId?: string,
) => {
  const r = await fetch(
    `/api/users/${loggedInUser?.id}/feed-item-actions/event-items/${eventId}/get-event-info`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  const res = await r.json();

  if (!r.ok) {
    throw new Error(res.error ?? "unable to get event info");
  }

  return res.eventInfo as EventData;
};
