import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getGravatarUrl } from "../gravatar";
import { FeedItemUser } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { getDistFromMiles } from "../geolocation/get-distance-from-event/getDistFromEvent";
import { geocodeAddress } from "../geolocation/geocode-address/geocodeAddress";
import { canViewerSee } from "../user-privacy/canViewerSee";
import { UserStatusDoc } from "@/lib/models/UserStatusDoc";
import { getNearbyUsers } from "../discoverability/get-nearby-users/getNearbyUsers";
import { getNearbyEvents } from "../discoverability/get-nearby-events/getNearbyEvents";
import { SessionUser } from "@/types/user-session";
import { insertFeedItemAt } from "../discoverability/feed-injection-logic/feedInjection";

function resolveAvatar(user: UserDoc): string {
  return user.avatar ?? getGravatarUrl(user.email!);
}

export async function generateUserFeed(
  user: UserDoc,
  friends: UserDoc[],
  events: EventDoc[],
  statuses: UserStatusDoc[],
): Promise<FeedItemUser[]> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  async function logFeedItem(
    item: Omit<UserFeedDoc, "_id"> & { sourceId: string },
  ) {
    const exists = await feedCollection.updateOne(
      {
        userId: item.userId,
        sourceId: item.sourceId,
        type: item.type,
      },
      {
        $setOnInsert: {
          ...item,
          timestamp: item.timestamp ?? new Date().toISOString(),
        },
      },
      {
        upsert: true,
      },
    );
    if (exists) {
      console.log("Post: ", item);
      return;
    }
    if (!exists) {
      await feedCollection.insertOne({
        ...item,
        timestamp: item.timestamp ?? new Date(),
      });
    }
  }

  const nowIso = new Date().toISOString();
  const viewerLat = user.location?.lat;
  const viewerLng = user.location?.lng;
  const viewerHasCoords =
    typeof viewerLat === "number" && typeof viewerLng === "number";

  const ALLOWED_TYPES = [
    "joined_platform",
    "hosted_event",
    "profile_status_updated",
  ];

  await logFeedItem({
    userId: user._id!,
    type: "joined_platform",
    sourceId: `${user._id?.toString()}:joined_platform`,
    actor: {
      id: user._id!.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: resolveAvatar(user),
    },
    target: { snippet: `${user.firstName} just joined ThirdSpace! 🚀` },
    timestamp: new Date().toISOString(),
  });

  const actors: UserDoc[] = [user, ...friends];

  for (const actorUser of actors) {
    console.log(`Can I see? ${!canViewerSee(actorUser, user)}`);
    if (!canViewerSee(actorUser, user)) continue;
    for (const event of events) {
      console.log(`hello: ${event._id}`);

      const host = await userCollection.findOne({ _id: event.host });
      if (event.host?.toString() !== actorUser._id?.toString()) continue;

      const canceledOrCompletedEvents = await eventCollection
        .find({
          status: { $in: ["canceled", "completed"] },
        })
        .toArray();

      const canceledOrCompletedIds = canceledOrCompletedEvents.map(
        (e) => e._id,
      );

      const deleted = await feedCollection.deleteMany({
        "actor.eventId": { $in: canceledOrCompletedIds },
      });

      // Event coords (fallback to geocode)
      let evLat = event.location?.lat;
      let evLng = event.location?.lng;
      if (typeof evLat !== "number" || typeof evLng !== "number") {
        const addr = event.location?.address ?? event.location?.name ?? "";
        if (!addr) {
          console.log(
            "[SKIP] no address/coords for",
            event.title,
            event.location,
          );
          continue;
        }
        const geo = await geocodeAddress(addr);
        if (!geo) {
          console.log("[SKIP] geocode failed for", event.title, "addr=", addr);
          continue;
        }
        evLat = geo.lat;
        evLng = geo.lng;
      }

      // Distance
      let distMiles: number | null = null;
      if (viewerHasCoords) {
        const d = getDistFromMiles(viewerLat, viewerLng, evLat!, evLng!);
        distMiles = typeof d === "number" ? Number(d.toFixed(1)) : null;
      }
    }

    const userStatuses = statuses.filter(
      (s) => String(s.userId) === String(actorUser._id!),
    );

    for (const status of userStatuses) {
      await logFeedItem({
        userId: user._id!,
        sourceId: `${status.sourceId}`,
        type: "profile_status_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: resolveAvatar(actorUser),
        },
        target: {
          userId: actorUser._id,
          status: {
            content: status.content,
            attachments: status.attachments ?? [],
            sourceId: status.sourceId,
          },
        },
        timestamp: nowIso,
      });
    }
  }

  const feed = await feedCollection
    .find({ userId: user._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  const feedItems: FeedItemUser[] = feed
    .filter((doc) => ALLOWED_TYPES.includes(doc.type))
    .map((doc) => ({
      id: String(doc._id!),
      type: doc.type,
      actor: {
        id: doc.actor.id,
        firstName: doc.actor.firstName ?? "",
        lastName: doc.actor.lastName ?? "",
        username: doc.actor.username,
        avatar: doc.actor.avatar,
        eventStatus: doc.actor.eventStatus,
        eventId: doc.actor.eventId,
        eventSnippet: doc.actor.eventSnippet,
        eventAttachments: doc.actor.eventAttachments,
        distanceFromEvent: doc.actor.distanceFromEvent,
        eventLocation: doc.actor.eventLocation,
      },
      target: {
        ...doc.target,
        snippet: doc.target?.snippet,
        attachments: doc.target?.attachments,
      },
      timestamp: doc.timestamp,
    }));

  return feedItems;
}
