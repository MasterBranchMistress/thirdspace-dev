import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { FeedItemEvent } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventFeedDoc } from "@/lib/models/EventFeedDoc";
import { ObjectId } from "mongodb";

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
    let hostUser =
      friends.find((f) => f._id?.equals(event.host)) ||
      (await userCollection.findOne({ _id: event.host }));

    const base: Omit<EventFeedDoc, "_id"> = {
      userId: user._id!,
      actor: {
        eventId: event._id?.toString() || "",
        eventName: event.title || "Untitled Event",
        location: {
          name: event.location?.name || "Cool Event",
          lat: event.location?.lat ?? 0,
          lng: event.location?.lng ?? 0,
        },
        totalAttendance: event.attendees?.length || 0,
        startingDate: event.date,
      },
      target: {
        eventId: event._id!,
        title: event.title,
        host: hostUser?.firstName,
        location: {
          name: event.location?.name,
          lat: event.location?.lat,
          lng: event.location?.lng,
        },
        description: event.description,
        budget: event.budgetInfo,
        tags: event.tags || [],
      },
      timestamp: new Date(),
      type: "event_coming_up", // temporary default, overwritten below
    };

    if (isPopular) {
      await logFeedItem({
        ...base,
        type: "event_is_popular",
        timestamp: event.updatedAt ?? event.date,
      });
    }

    if (isUpcoming) {
      await logFeedItem({
        ...base,
        type: "event_coming_up",
        timestamp: event.date,
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
    },
    timestamp: doc.timestamp.toString(),
  }));

  return feed;
}
