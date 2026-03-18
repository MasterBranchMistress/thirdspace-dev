import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { UserDoc } from "@/lib/models/User";
import { EventDoc } from "@/lib/models/Event";

function normalizeTag(t: string) {
  return t
    .trim()
    .toLowerCase()
    .replace(/^#/, "") // remove leading hashtag
    .replace(/\s+/g, "-") // spaces -> hyphens
    .replace(/[^a-z0-9-]/g, ""); // strip weird chars
}

function karmaToBoost(karma?: number) {
  const k = Math.max(0, Math.min(100, karma ?? 0));
  const k01 = k / 100; // 0..1
  return 1 + k01 * 0.15; // 1.00..1.15
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const userId = (await context.params).id;

  try {
    const body = await req.json().catch(() => ({}));
    let radiusKm: number = body.radiusKm ?? 25;
    const limit: number = body.limit ?? 50;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    // Get viewer location (and optionally their tags if you don't want FE to send them)
    const viewer = await db
      .collection(COLLECTIONS._USERS)
      .findOne({ _id: new ObjectId(userId) });

    if (!viewer?.location?.lat || !viewer?.location?.lng) {
      return NextResponse.json(
        { error: "User location not found" },
        { status: 404 },
      );
    }

    const viewerFollowers: string[] = Array.isArray(viewer.following)
      ? viewer.following
      : [];
    const viewerFollowerSet = new Set(viewerFollowers);
    const viewerFriends: string[] = Array.isArray(viewer.friends)
      ? viewer.friends
      : [];
    const viewerFriendSet = new Set(viewerFriends);
    const viewerTags: string[] = Array.isArray(viewer.tags) ? viewer.tags : [];
    const viewerTagSet = new Set(viewerTags.map(normalizeTag));

    await db
      .collection(COLLECTIONS._EVENTS)
      .createIndex({ "location.geo": "2dsphere" });
    const { lat, lng } = viewer.location;
    const maxDistanceMeters = radiusKm * 1000;

    // Use geoNear to get distance back
    const candidates = await db
      .collection(COLLECTIONS._EVENTS)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distanceMeters",
            maxDistance: maxDistanceMeters,
            spherical: true,
            // query: { public: true },
          },
        },

        // lookup host account to grab karma multiplier
        {
          $lookup: {
            from: COLLECTIONS._USERS,
            localField: "host",
            foreignField: "_id",
            as: "host",
          },
        },
        { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },

        { $limit: 250 }, // cap candidate pool before scoring
      ])
      .toArray();

    //TODO: temporary until user preferences are added
    if (candidates.length < 10) {
      radiusKm = 50;
    }

    const scored = candidates.map((evt: any) => {
      const tags: string[] = Array.isArray(evt.tags) ? evt.tags : [];
      const normalizedEventTags = tags.map(normalizeTag);

      // shared tags
      const sharedTags = normalizedEventTags.filter((t) => viewerTagSet.has(t));
      const sharedUnique = Array.from(new Set(sharedTags));
      const sharedTagCount = sharedUnique.length;

      // distance score 0..1
      const distanceMeters = Number(evt.distanceMeters ?? 0);
      const distanceScore = Math.max(0, 1 - distanceMeters / maxDistanceMeters);

      const attendees = Number(evt.attendees?.length ?? 0);
      const attendanceScore = Math.log1p(attendees) * 6;

      // base score (tags dominate)
      const baseScore =
        sharedTagCount * 10 + distanceScore * 3 + attendanceScore;

      // karma boost (host karma)

      const hostKarma = evt.host.karmaScore;

      const score =
        sharedTagCount > 0 ? baseScore * karmaToBoost(hostKarma) : baseScore; // guardrail: no karma boost with zero overlap

      return {
        ...evt,
        sharedTags: sharedUnique.slice(0, 3),
        sharedTagCount,
        distanceMeters,
        relevanceScore: score,
        hostKarma: hostKarma, // optional for UI
        hostName:
          evt.host?.firstName +
          (evt.host?.lastName ? ` ${evt.host.lastName}` : ""),
        hostAvatar: evt.host?.avatar ?? "/placeholder-avatar.png",
        popularity: Number(score ?? 50),
      };
    });

    // Filtering rules: prefer overlap when viewer has tags
    const filtered = scored.filter((e) => {
      if (viewerTagSet.size > 0 && e.sharedTagCount === 0) return false;
      return true;
    });

    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ events: filtered.slice(0, limit) });
  } catch (error) {
    console.error("Nearby events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby events" },
      { status: 500 },
    );
  }
}
