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
  const feedCollection = db.collection<EventFeedDoc>(COLLECTIONS._USER_FEED);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  const now = new Date();

  // Utility to insert or update if missing/incomplete
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
    const isUpcoming =
      event.date.getTime() - now.getTime() < 1000 * 60 * 60 * 48; // within 48h
    const isPopular = (event.attendees?.length || 0) > 3;

    // Lookup host user from friends or DB
    const hostUser =
      friends.find((f) => f._id?.equals(event.host)) ||
      (await userCollection.findOne({ _id: event.host }));

    const base: Omit<EventFeedDoc, "_id"> = {
      userId: user._id!,
      actor: {
        eventId: event._id,
        eventName: event.title || "Untitled Event",
        host: hostUser?.firstName,
        startingDate: event.date.toISOString(),
        avatar: hostUser?.avatar,
      },
      target: {
        eventId: event._id!,
        title: event.title,
        host: hostUser?.firstName,
        avatar: hostUser?.avatar,
        totalAttendance: event.attendees?.length || 0,
        location: {
          name: event.location?.name,
          lat: event.location?.lat,
          lng: event.location?.lng,
        },
        description: event.description,
        budget: event.budgetInfo,
        tags: event.tags || [],
        startingDate: event.date.toISOString(),
        attachments: event.attachments,
      },
      timestamp: new Date(),
      type: "event_coming_up", // temporary default, overwritten below
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
      eventId: doc.actor.eventId,
      eventName: doc.actor.eventName,
      location: doc.actor.location,
      totalAttendance: doc.actor.totalAttendance,
      startingDate: doc.actor.startingDate,
      avatar: doc.actor.avatar,
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
      notes: doc.target?.notes || "",
      currency: doc.target?.currency || undefined,
      cost: doc.target?.cost ?? undefined,

      startingDate:
        doc.target?.startingDate?.toString() ??
        doc.actor?.startingDate ??
        undefined,

      attachments: doc.target?.attachments ?? [],
    },
    timestamp: doc.timestamp,
  }));

  return feed;
}
