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

function resolveAvatar(user: UserDoc): string {
  return user.avatar ?? getGravatarUrl(user.email);
}

export async function generateUserFeed(
  user: UserDoc,
  friends: UserDoc[],
  events: EventDoc[]
): Promise<FeedItemUser[]> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const feedCollection = db.collection<UserFeedDoc>(COLLECTIONS._USER_FEED);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

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

  await logFeedItem({
    userId: user._id!,
    type: "joined_platform",
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
    for (const event of events) {
      if (event.type === "hosted_event") {
        const now = new Date();
        const twoWeeks = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

        const eventDate = new Date(event.date); // ✅ normalize string → Date

        console.log(eventDate >= now && eventDate <= twoWeeks);

        const isUpcoming = eventDate >= now && eventDate <= twoWeeks;

        if (!isUpcoming) continue;
      }

      const host = await userCollection.findOne({ _id: event.host });
      if (event.host?.toString() !== actorUser._id?.toString()) continue;

      const canceledOrCompletedEvents = await eventCollection
        .find({
          status: { $in: ["canceled", "completed"] },
        })
        .toArray();

      const canceledOrCompletedIds = canceledOrCompletedEvents.map(
        (e) => e._id
      );

      const deleted = await feedCollection.deleteMany({
        "actor.eventId": { $in: canceledOrCompletedIds },
      });

      console.log(deleted);

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

      // Distance
      let distMiles: number | null = null;
      if (viewerHasCoords) {
        const d = getDistFromMiles(viewerLat, viewerLng, evLat!, evLng!);
        distMiles = typeof d === "number" ? Number(d.toFixed(1)) : null;
      }

      const passesDistance = viewerHasCoords
        ? distMiles !== null && distMiles <= radiusMiles
        : true;

      if (!passesDistance) continue;

      const actor = {
        id: actorUser._id!.toString(),
        email: actorUser.email,
        firstName: actorUser.firstName,
        lastName: actorUser.lastName,
        username: actorUser.username,
        avatar: resolveAvatar(actorUser),
        eventStatus: event.status,
        eventId: event._id,
        eventSnippet: event.description,
        eventAttachments: event.attachments,
        distanceFromEvent: distMiles ?? 0,
        eventLocation: event.location?.name,
      };

      if (host) {
        if (canViewerSee(host, user)) {
          await logFeedItem({
            userId: user._id!,
            type: "hosted_event",
            actor,
            target: {
              eventId: event._id,
              title: event.title,
              snippet: event.description,
              startingDate: new Date(event.date).toISOString(),
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
      }
    }

    // Profile updates
    if (actorUser.avatar && canViewerSee(actorUser, user)) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_avatar_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: actorUser.avatar,
        },
        target: { userId: actorUser._id!, snippet: actorUser.avatar },
        timestamp: nowIso,
      });
    }

    if (
      actorUser.location &&
      canViewerSee(actorUser, user) &&
      actorUser.shareLocation === true
    ) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_location_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: resolveAvatar(actorUser),
        },
        target: { userId: actorUser._id!, snippet: actorUser.location.name },
        timestamp: nowIso,
      });
    }

    if (
      actorUser.status &&
      actorUser.statusLastUpdatedAt &&
      canViewerSee(actorUser, user)
    ) {
      await logFeedItem({
        userId: user._id!,
        type: "profile_status_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: resolveAvatar(actorUser),
        },
        target: {
          userId: actorUser._id!,
          snippet: actorUser.status,
          avatar: actorUser.avatar,
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
      target: doc.target,
      timestamp: doc.timestamp,
    }));

  return feedItems;
}
