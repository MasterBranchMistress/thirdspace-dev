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
  const viewerHasCoords =
    typeof viewerLat === "number" && typeof viewerLng === "number";
  const ALLOWED_TYPES = [
    "joined_platform",
    "hosted_event",
    "profile_avatar_updated",
    "profile_bio_updated",
    "profile_status_updated",
  ];

  const radiusMiles =
    (user as any)?.settings?.nearbyRadiusMiles &&
    Number.isFinite((user as any).settings.nearbyRadiusMiles)
      ? Number((user as any).settings.nearbyRadiusMiles)
      : 40;

  //New users just joined to get feed going
  logFeedItem({
    userId: user._id!,
    type: "joined_platform",
    actor: {
      id: user._id?.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
    },
    target: {
      snippet: `${user.firstName} just joined ThirdSpace! 🚀`,
    },
    timestamp: new Date().toISOString(),
  });
  // ✅ Include the viewer as an actor so their own updates show up even with 0 friends.
  const actors: UserDoc[] = [user, ...friends];

  for (const actorUser of actors) {
    for (const event of events) {
      // Only events hosted by this actor
      // if (String(event.host) !== String(actorUser._id)) continue;
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);
      const isUpcoming = event.date >= now && event.date <= twoWeeks;
      if (!isUpcoming) continue;

      // Event coords (fallback to geocode)
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

      // Distance: if viewer coords unknown, don't gate by distance
      let distMiles: number | null = null;
      if (viewerHasCoords) {
        const d = getDistFromMiles(viewerLat, viewerLng, evLat!, evLng!);
        distMiles = typeof d === "number" ? Number(d.toFixed(1)) : null;
      }

      const passesDistance = viewerHasCoords
        ? distMiles !== null && distMiles <= radiusMiles
        : true;

      if (!passesDistance) continue;

      // Actor payload normalized
      const actor = {
        id: actorUser._id!.toString(),
        firstName: actorUser.firstName,
        lastName: actorUser.lastName,
        username: actorUser.username,
        avatar: actorUser.avatar || getGravatarUrl(actorUser.email),
        eventSnippet: event.description,
        eventAttachments: event.attachments,
        distanceFromEvent: distMiles, // can be null
        eventLocation: event.location?.name,
      };

      await logFeedItem({
        userId: user._id!, // the viewer's feed
        type: "hosted_event",
        actor: {
          ...actor,
          distanceFromEvent: distMiles ?? undefined,
        },
        target: {
          eventId: event._id,
          title: event.title,
          snippet: event.description ?? "",
          startingDate: event.date.toISOString(),
          location: event.location
            ? {
                name: event.location.name,
                lat: event.location.lat ?? evLat!,
                lng: event.location.lng ?? evLng!,
              }
            : undefined,
          distanceMiles: distMiles ?? undefined,
          attachments: event.attachments,
        },
        timestamp: nowIso,
      });
    }

    // Profile updates from each actor (viewer included so self-updates show)
    if (actorUser.avatar && actorUser.avatarLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_avatar_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: actorUser.avatar || getGravatarUrl(actorUser.email),
        },
        target: { userId: actorUser._id!, snippet: actorUser.avatar },
        timestamp: nowIso,
      });
    }

    if (actorUser.location && actorUser.locationLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_location_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: actorUser.avatar || getGravatarUrl(actorUser.email),
        },
        target: { userId: actorUser._id!, snippet: actorUser.location.name },
        timestamp: nowIso,
      });
    }

    if (actorUser.status && actorUser.statusLastUpdatedAt) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_status_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: actorUser.avatar || getGravatarUrl(actorUser.email),
        },
        target: { userId: actorUser._id!, snippet: actorUser.status },
        timestamp: nowIso,
      });
    }
  }

  const feed = await feedCollection
    .find({ userId: user._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  // Map to your UI type (note eventAttachments now matches)
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
