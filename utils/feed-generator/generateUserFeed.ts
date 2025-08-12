import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getGravatarUrl } from "../gravatar";
import { FeedItemUser } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { getDistFromMiles } from "../geolocation/get-distance-from-event/getDistFromEvent";
import { geocodeAddress } from "../geolocation/geocode-address/geocodeAddress";

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

  const nowIso = new Date().toISOString();
  const viewerLat = user.location?.lat;
  const viewerLng = user.location?.lng;

  const radiusMiles =
    (user as any)?.settings?.nearbyRadiusMiles &&
    Number.isFinite((user as any).settings.nearbyRadiusMiles)
      ? Number((user as any).settings.nearbyRadiusMiles)
      : 40; // default radius

  for (const friend of friends) {
    for (const event of events) {
      // TODO: Events hosted only by friends?
      // if (String(event.hostId) !== String(friend._id)) continue;

      // Upcoming: within next 14 days
      const now = new Date();
      const twoWeeksFromNow = new Date(
        now.getTime() + 1000 * 60 * 60 * 24 * 14
      );
      const isUpcoming = event.date >= now && event.date <= twoWeeksFromNow;

      if (!isUpcoming) continue;

      // Ensure event coords (prefer stored coords, else geocode address/name)
      let evLat = event.location?.lat;
      let evLng = event.location?.lng;

      if (typeof evLat !== "number" || typeof evLng !== "number") {
        const addr = event.location?.address ?? event.location?.name ?? "";
        if (!addr) continue;
        const geo = await geocodeAddress(addr);
        if (!geo) continue;
        evLat = geo.lat;
        evLng = geo.lng;
      }

      // Compute distance from viewer; skip if viewer location unknown
      const distMiles = getDistFromMiles(viewerLat, viewerLng, evLat, evLng);
      const isNearby =
        typeof distMiles === "number" && distMiles <= radiusMiles;

      const actor = {
        id: friend._id!.toString(),
        firstName: friend.firstName,
        lastName: friend.lastName,
        username: friend.username,
        avatar: friend.avatar || getGravatarUrl(friend.email),
        eventSnippet: event.description,
        attachments: event.attachments,
        distanceFromEvent: Number((distMiles as number).toFixed(1)),
        eventLocation: event.location?.name,
      };

      // console.log(actor);

      if (isUpcoming && isNearby) {
        await logFeedItem({
          userId: user._id!,
          type: "hosted_event",
          actor,
          target: {
            eventId: event._id,
            title: event.title,
            snippet: event.description ?? "",
            startingDate: event.date.toISOString(),
            location: event.location
              ? {
                  name: event.location.name,
                  address: event.location.address,
                  lat: event.location.lat ?? evLat,
                  lng: event.location.lng ?? evLng,
                }
              : undefined,
            distanceMiles: Number((distMiles as number).toFixed(1)),
            attachments: event.attachments,
          },
          timestamp: nowIso,
        });
      }
    }

    if (friend.avatar && friend.avatarLastUpdatedAt) {
      const actor = {
        id: friend._id!.toString(),
        firstName: friend.firstName,
        lastName: friend.lastName,
        username: friend.username,
        avatar: friend.avatar || getGravatarUrl(friend.email),
      };
      await logFeedItem({
        userId: user._id!,
        type: "profile_avatar_updated",
        actor,
        target: { userId: friend._id!, snippet: friend.avatar },
        timestamp: nowIso,
      });
    }

    if (friend.location && friend.locationLastUpdatedAt) {
      const actor = {
        id: friend._id!.toString(),
        firstName: friend.firstName,
        lastName: friend.lastName,
        username: friend.username,
        avatar: friend.avatar || getGravatarUrl(friend.email),
      };
      await logFeedItem({
        userId: user._id!,
        type: "profile_location_updated",
        actor,
        target: { userId: friend._id!, snippet: friend.location.name },
        timestamp: nowIso,
      });
    }

    if (friend.status && friend.statusLastUpdatedAt) {
      const actor = {
        id: friend._id!.toString(),
        firstName: friend.firstName,
        lastName: friend.lastName,
        username: friend.username,
        avatar: friend.avatar || getGravatarUrl(friend.email),
      };
      await logFeedItem({
        userId: user._id!,
        type: "profile_status_updated",
        actor,
        target: { userId: friend._id!, snippet: friend.status },
        timestamp: nowIso,
      });
    }
  }

  const feed = await feedCollection
    .find({ userId: user._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  const feedItems: FeedItemUser[] = feed.map((doc) => ({
    id: String(doc._id!), // if you have a dedupe 'key', use that instead
    type: doc.type,
    actor: {
      id: doc.actor.id,
      firstName: doc.actor.firstName ?? "",
      lastName: doc.actor.lastName ?? "",
      username: doc.actor.username,
      avatar: doc.actor.avatar ?? "",
      eventSnippet: doc.actor.eventSnippet,
      eventAttachments: doc.actor.eventAttachments,
      distanceFromEvent: doc.actor.distanceFromEvent,
      eventLocation: doc.actor.eventLocation,
    },
    target: doc.target,
    timestamp: doc.timestamp,
  }));

  return feedItems;
}
