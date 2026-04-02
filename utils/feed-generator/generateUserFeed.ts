import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getGravatarUrl } from "../gravatar";
import { FeedItemUser } from "@/types/user-feed";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS, FOUNDER_WELCOME_POST } from "@/lib/constants";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { getDistFromMiles } from "../geolocation/get-distance-from-event/getDistFromEvent";
import { geocodeAddress } from "../geolocation/geocode-address/geocodeAddress";
import { canViewerSee } from "../user-privacy/canViewerSee";
import { UserStatusDoc } from "@/lib/models/UserStatusDoc";
import { ObjectId } from "mongodb";

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
  const founder = await userCollection.findOne({
    _id: new ObjectId(process.env.FOUNDER_USER_ID),
  });

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
    "profile_avatar_updated",
    "profile_bio_updated",
    "user_promoted",
    // "updated_event", //decided against this. Might get noisy.
  ];

  await logFeedItem({
    userId: user._id!,
    type: "joined_platform",
    sourceId: `${user._id?.toString()}:joined_platform`,
    actor: {
      id: founder?._id!.toString(),
      firstName: founder?.firstName,
      lastName: founder?.lastName,
      username: founder?.username,
      avatar: resolveAvatar(founder!),
      qualityBadge: founder?.qualityBadge,
      karmaScore: founder?.karmaScore,
    },
    target: {
      snippet: FOUNDER_WELCOME_POST._FOUNDER_GREETING,
      firstName: user.firstName,
      attachments: [
        {
          type: "video",
          url: FOUNDER_WELCOME_POST._WELCOME_VIDEO_URL,
        },
      ],
      targetTags: user.tags,
      targetVisibility: user.visibility,
      exploredSolarSystem: user.onboarding?.exploredSolarSystem,
      exploredSpacestation: user.onboarding?.exploredSpaceStation,
    },
    timestamp: new Date().toISOString(),
  });

  const actors: UserDoc[] = [user, ...friends];

  for (const actorUser of actors) {
    if (user.onboarded !== true) {
      continue;
    }
    if (!canViewerSee(actorUser, user)) continue;
    for (const event of events) {
      await userCollection.findOne({ _id: event.hostId });
      if (event.hostId?.toString() !== actorUser._id?.toString()) continue;

      const canceledOrCompletedEvents = await eventCollection
        .find({
          status: { $in: ["canceled", "completed"] },
        })
        .toArray();

      const canceledOrCompletedIds = canceledOrCompletedEvents.map(
        (e) => e._id,
      );

      await feedCollection.deleteMany({
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
        userId: user._id,
        sourceId: `${status.sourceId}`,
        type: "profile_status_updated",
        actor: {
          id: actorUser._id!.toString(),
          firstName: actorUser.firstName,
          lastName: actorUser.lastName,
          username: actorUser.username,
          avatar: resolveAvatar(actorUser),
          qualityBadge: actorUser.qualityBadge,
          karmaScore: actorUser.karmaScore,
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

    await logFeedItem({
      userId: actorUser._id,
      type: "user_promoted",
      sourceId: `${actorUser._id}-promotion-${actorUser.newRank}`,
      actor: {
        id: actorUser._id?.toString(),
        username: actorUser.username,
        avatar: actorUser.avatar,
        firstName: actorUser.firstName,
        lastName: actorUser.lastName,
        karmaScore: actorUser.karmaScore,
      },
      target: {
        newRank: actorUser?.newRank!, //If theres a promotion, theres a new rank
        karmaScore: actorUser.karmaScore,
        boostedCount: 0,
        boostedBy: [],
        timeOfPromotion: new Date(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  const feed = await feedCollection
    .find({ userId: user._id })
    .sort({ timestamp: -1, _id: -1 })
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
        qualityBadge: doc.actor.qualityBadge,
        karmaScore: doc.actor.karmaScore,
      },
      target: {
        ...doc.target,
        userId: doc.target?.userId?.toString(),
        username: doc.target?.username,
        snippet: doc.target?.snippet,
        attachments: doc.target?.attachments,
        qualityBadge: doc.target?.qualityBadge,
        karmaScore: doc.target?.karmaScore,
      },
      timestamp: doc.timestamp,
    }));

  return feedItems;
}
