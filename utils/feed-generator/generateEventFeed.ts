import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { FeedItemEvent } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventFeedDoc } from "@/lib/models/EventFeedDoc";

export async function generateEventFeed(
  user: UserDoc,
  events: EventDoc[],
  friends: UserDoc[]
): Promise<FeedItemEvent[]> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const feedCollection = db.collection<EventFeedDoc>(COLLECTIONS._EVENT_FEED);

  const now = new Date();

  async function logFeedItem(item: Omit<EventFeedDoc, "_id">) {
    const exists = await feedCollection.findOne({
      userId: item.userId,
      type: item.type,
      "actor.eventId": item.actor.eventId,
      "target.eventId": item.target?.eventId,
    });

    if (!exists) {
      await feedCollection.insertOne({
        ...item,
        timestamp: item.timestamp ?? new Date(),
      });
    }
  }

  for (const event of events) {
    const isUpcoming =
      event.date.getTime() - now.getTime() < 1000 * 60 * 60 * 48; // within 48 hours
    const isPopular = (event.attendees?.length || 0) > 15;

    const isFriendHost = friends.some((f) => event.host.equals(f._id));
    const isUserAttending = event.attendees?.some((id) => id.equals(user._id));

    const base = {
      userId: user._id!,
      actor: {
        eventId: event._id?.toString() || "",
        eventName: event.title || "Untitled Event",
        location: {
          name: event.title ?? "Cool Event",
          lat: event.location?.lat ?? 0,
          lng: event.location?.lng ?? 0,
        },
        totalAttendance: event.attendees?.length || 0,
        startingDate: event.date,
      },
      target: {
        eventId: event._id!,
        title: event.title,
      },
    };

    if (isPopular && !isFriendHost && !isUserAttending) {
      await logFeedItem({
        ...base,
        type: "event_is_popular",
        timestamp: event.updatedAt ?? event.date,
      });
    }

    if (isUpcoming && !isFriendHost && !isUserAttending) {
      await logFeedItem({
        ...base,
        type: "event_coming_up",
        timestamp: event.date,
      });
    }
  }

  // ✅ Fetch recent event feed items for this user
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
      eventId: doc.actor.eventId,
      eventName: doc.actor.eventName,
      location: doc.actor.location,
      totalAttendance: doc.actor.totalAttendance,
      startingDate: doc.actor.startingDate,
    },
    target: doc.target,
    timestamp: doc.timestamp.toISOString(),
  }));

  return feed;
}
