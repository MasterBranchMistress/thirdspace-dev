import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getGravatarUrl } from "../gravatar";
import { FeedItemUser } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { ObjectId } from "mongodb";

export async function generateUserFeed(
  user: UserDoc,
  friends: UserDoc[],
  events: EventDoc[]
): Promise<FeedItemUser[]> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);

  async function logFeedItem(item: Omit<UserFeedDoc, "_id">) {
    const exists = await feedCollection.findOne({
      userId: item.userId,
      type: item.type,
      "actor.id": item.actor.id,
      "target.userId": item.target?.userId,
      "target.eventId": item.target?.eventId,
    });

    if (!exists) {
      await feedCollection.insertOne({
        ...item,
        timestamp: item.timestamp ?? new Date(),
      });
    }
  }

  const now = new Date().toISOString();

  for (const friend of friends) {
    const actor = {
      id: friend._id!.toString(),
      firstName: friend.firstName,
      lastName: friend.lastName,
      username: friend.username,
      avatar: friend.avatar || getGravatarUrl(friend.email),
    };

    // ✅ Hosted Events
    for (const event of events) {
      // const isHost = event.host.equals(friend._id);
      // if (!isHost) continue;

      const now_in_date_format = new Date();
      const twoWeeksFromNow = new Date(
        now_in_date_format.getTime() + 1000 * 60 * 60 * 24 * 14
      );
      const isUpcoming =
        event.date >= now_in_date_format && event.date <= twoWeeksFromNow;

      if (isUpcoming) {
        await logFeedItem({
          userId: user._id!,
          type: "hosted_event",
          actor,
          target: {
            eventId: event._id,
            snippet: event.title,
            location: {
              name: event.location?.name,
              lat: event.location?.lat,
              lng: event.location?.lng,
            },
          },
          timestamp: now,
        });
      }
    }

    if (friend.avatar && friend.avatarLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_avatar_updated",
        actor,
        target: { userId: friend._id!, snippet: friend.avatar },
        timestamp: now,
      });
    }

    if (friend.location && friend.locationLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_location_updated",
        actor,
        target: { userId: friend._id!, snippet: friend.location },
        timestamp: now,
      });
    }

    if (friend.status && friend.statusLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_status_updated",
        actor,
        target: {
          userId: friend._id!,
          snippet: friend.status,
        },
        timestamp: now,
      });
    }
  }

  const feed = await feedCollection
    .find({ userId: user._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  const feedItems: FeedItemUser[] = feed.map((doc) => ({
    id: String(doc._id!),
    type: doc.type,
    actor: {
      id: doc.actor.id,
      firstName: doc.actor.firstName ?? "",
      lastName: doc.actor.lastName ?? "",
      username: doc.actor.username,
      avatar: doc.actor.avatar ?? "",
    },
    target: doc.target,
    timestamp: doc.timestamp.toString(),
  }));

  return feedItems;
}
