// lib/feed/generateEventFeed.ts
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { FeedItemEvent } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventFeedDoc } from "@/lib/models/EventFeedDoc";
import { getGravatarUrl } from "../gravatar";

/** Always resolve a string avatar URL */
function resolveAvatar(user?: UserDoc | null): string {
  if (!user) return "/misc/party.jpg"; // fallback
  return user.avatar ?? getGravatarUrl(user.email);
}

export async function generateEventFeed(
  user: UserDoc,
  events: EventDoc[],
  friends: UserDoc[]
): Promise<FeedItemEvent[]> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const feedCollection = db.collection<EventFeedDoc>(COLLECTIONS._USER_FEED);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  const now = new Date();

  // Upsert helper
  async function logFeedItem(item: Omit<EventFeedDoc, "_id">) {
    await feedCollection.updateOne(
      {
        userId: item.userId,
        type: item.type,
        "actor.eventId": item.actor.eventId,
        "target.eventId": item.target?.eventId,
      },
      { $setOnInsert: { ...item, timestamp: new Date() } },
      { upsert: true }
    );
  }

  for (const event of events) {
    const msUntil = event.date.getTime() - now.getTime();
    const isUpcoming = msUntil > 0 && msUntil < 1000 * 60 * 60 * 48; // next 48h only
    const isPopular = (event.attendees?.length || 0) > 1;

    // Lookup host user
    const hostUser =
      friends.find((f) => f._id?.equals(event.host)) ||
      (await userCollection.findOne({ _id: event.host }));

    const base: Omit<EventFeedDoc, "_id"> = {
      userId: user._id!,
      actor: {
        id: hostUser?._id?.toString(),
        email: hostUser?.email,
        eventId: event._id,
        eventName: event.title || "Untitled Event",
        host: hostUser?.firstName,
        startingDate: event.date.toISOString(),
        avatar: resolveAvatar(hostUser),
      },
      target: {
        eventId: event._id!,
        title: event.title,
        host: hostUser?.firstName,
        avatar: resolveAvatar(hostUser),
        totalAttendance: event.attendees?.length || 0,
        location: event.location,
        description: event.description,
        budget: event.budgetInfo,
        tags: event.tags || [],
        startingDate: event.date.toISOString(),
        attachments: event.attachments,
      },
      timestamp: new Date(),
      type: "event_coming_up",
    };

    if (isPopular) {
      await logFeedItem({
        ...base,
        type: "event_is_popular",
        timestamp: new Date(),
      });
    }

    if (isUpcoming) {
      await logFeedItem({
        ...base,
        type: "event_coming_up",
        timestamp: new Date(),
      });
    }
  }

  // Fetch the latest event feed items for this user
  const results = await feedCollection
    .find({
      userId: user._id,
      type: { $in: ["event_coming_up", "event_is_popular"] },
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  const feed: FeedItemEvent[] = results.map((doc) => ({
    id: doc._id!.toString(),
    type: doc.type as FeedItemEvent["type"],
    actor: {
      id: doc.actor.id,
      eventId: doc.actor.eventId,
      eventName: doc.actor.eventName,
      startingDate: doc.actor.startingDate,
      avatar: typeof doc.actor.avatar === "string" ? doc.actor.avatar : "",
    },
    target: {
      eventId: doc.target?.eventId || undefined,
      host: doc.target?.host || undefined,
      title: doc.target?.title || "",
      location: {
        name: doc.target?.location?.name || "",
        lat: doc.target?.location?.lat ?? undefined,
        lng: doc.target?.location?.lng ?? undefined,
      },
      description: doc.target?.description || "",
      budget: doc.target?.budget || undefined,
      tags: doc.target?.tags || [],
      startingDate:
        doc.target?.startingDate?.toString() ??
        doc.actor?.startingDate ??
        undefined,
      attachments: doc.target?.attachments ?? [],
      avatar: typeof doc.target?.avatar === "string" ? doc.target.avatar : "",
    },
    timestamp: doc.timestamp,
  }));

  return feed;
}
