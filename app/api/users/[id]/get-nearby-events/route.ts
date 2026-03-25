import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { normalizeTag } from "@/utils/metadata/tag-handling/normalizeTags";
import { getFuzzyMatchingTags } from "@/utils/tag-extractor/fuzzyTagMatcher";

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
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventCollection = db.collection(COLLECTIONS._EVENTS);
  const userCollection = db.collection(COLLECTIONS._USERS);
  // Get viewer location (and optionally their tags if you don't want FE to send them)

  try {
    const {
      radiusKm = 50,
      minShared = 1,
      limit = 20,
    } = await req.json().catch(() => ({}));

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const idx = await eventCollection.indexes();
    if (!idx.some((i) => i.key?.["location.geo"] === "2dsphere")) {
      await eventCollection.createIndex({ "location.geo": "2dsphere" });
    }

    // 1) Load requester’s location + tags
    const me = await userCollection.findOne(
      { _id: new ObjectId(String(userId)) },
      {
        projection: {
          "location.geo": 1,
          normalizedTags: 1,
          tagMatchKeys: 1,
          blocked: 1,
          following: 1,
          friends: 1,
        },
      },
    );

    if (!me)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    const myPoint = me?.location?.geo;

    const myNormalizedTags: string[] = Array.isArray(me?.normalizedTags)
      ? me.normalizedTags
      : [];

    const myTagMatchKeys: string[] = Array.isArray(me?.tagMatchKeys)
      ? me.tagMatchKeys
      : [];

    const combinedTags = Array.from(
      new Set([...myNormalizedTags, ...myTagMatchKeys]),
    );

    const viewerFollowers: string[] = Array.isArray(me.following)
      ? me.following
      : [];
    const viewerFollowerSet = Array.from(new Set(viewerFollowers));
    const viewerFriends: string[] = Array.isArray(me.friends) ? me.friends : [];
    const viewerFriendSet = Array.from(new Set(viewerFriends));
    const viewerTags: string[] = Array.isArray(me.tags) ? me.tags : [];
    const viewerTagSet = new Set(viewerTags.map(normalizeTag));
    const maxDistanceMeters = radiusKm * 1000;

    const excludeIds = [
      new ObjectId(me._id),
      ...viewerFriendSet,
      ...viewerFollowerSet,
    ];

    const viewerCombinedTags = Array.from(
      new Set([...(me.normalizedTags ?? []), ...(me.tagMatchKeys ?? [])]),
    );

    const pipeline = [
      {
        $geoNear: {
          near: myPoint,
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: maxDistanceMeters,
          query: {
            _id: { $nin: excludeIds },
            "location.geo": { $exists: true },
          },
        },
      },
      {
        $lookup: {
          from: COLLECTIONS._USERS,
          localField: "hostId",
          foreignField: "_id",
          as: "host",
        },
      },
      { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          candidateCombinedTags: {
            $setUnion: [
              { $ifNull: ["$normalizedTags", []] },
              { $ifNull: ["$tagMatchKeys", []] },
            ],
          },
          attendeeCount: {
            $size: { $ifNull: ["$attendees", []] },
          },
        },
      },
      {
        $addFields: {
          sharedTags: {
            $setIntersection: ["$candidateCombinedTags", viewerCombinedTags],
          },
          sharedTagCount: {
            $size: {
              $setIntersection: ["$candidateCombinedTags", viewerCombinedTags],
            },
          },
          distanceScore: {
            $max: [
              0,
              {
                $subtract: [
                  1,
                  { $divide: ["$distanceMeters", maxDistanceMeters] },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          baseScore: {
            $add: [
              { $multiply: ["$sharedTagCount", 10] },
              { $multiply: ["$distanceScore", 3] },
            ],
          },
        },
      },
      { $sort: { baseScore: -1, distanceMeters: 1 } },
      { $limit: Math.max(1, Math.min(limit, 100)) },
    ];

    const events = await eventCollection.aggregate(pipeline).toArray();

    const strongMatches = events.filter(
      (e: any) => (e.sharedTagCount ?? 0) >= 2,
    );
    const matchedTags = new Set(events.flatMap((e: any) => e.sharedTags ?? []));
    const unresolvedTags = viewerCombinedTags.filter(
      (t) => !matchedTags.has(t),
    );

    const shouldRunAI = strongMatches.length < 2 && unresolvedTags.length > 1;

    let finalEvents = [...events];

    if (shouldRunAI) {
      const fallbackCandidates = await eventCollection
        .aggregate([
          {
            $geoNear: {
              near: myPoint,
              distanceField: "distanceMeters",
              spherical: true,
              maxDistance: maxDistanceMeters,
              query: {
                _id: { $nin: excludeIds },
                "location.geo": { $exists: true },
                normalizedTags: { $exists: true, $ne: [] },
              },
            },
          },
          {
            $lookup: {
              from: COLLECTIONS._USERS,
              localField: "hostId",
              foreignField: "_id",
              as: "hostUser",
            },
          },
          {
            $unwind: {
              path: "$hostUser",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              normalizedTags: 1,
              tagMatchKeys: 1,
              distanceMeters: 1,
              date: 1,
              startTime: 1,
              hostId: 1,
              host: 1,

              hostAvatar: "$hostUser.avatar",
              hostUsername: "$hostUser.username",
              hostFirstName: "$hostUser.firstName",
              hostLastName: "$hostUser.lastName",
            },
          },
          { $limit: 10 },
        ])
        .toArray();

      const existingIds = new Set(events.map((e: any) => String(e._id)));
      const unresolvedCandidates = fallbackCandidates
        .filter((e: any) => !existingIds.has(String(e._id)))
        .slice(0, 5);

      const rescuedEvents = [];

      for (const candidate of unresolvedCandidates) {
        const candidateCombinedTags = Array.from(
          new Set([
            ...(Array.isArray(candidate.normalizedTags)
              ? candidate.normalizedTags
              : []),
            ...(Array.isArray(candidate.tagMatchKeys)
              ? candidate.tagMatchKeys
              : []),
          ]),
        );

        if (!candidateCombinedTags.length) continue;

        const fuzzyMatches = await getFuzzyMatchingTags(
          unresolvedTags,
          candidateCombinedTags,
        );

        if (fuzzyMatches.length >= 1) {
          const distanceMeters = Number(candidate.distanceMeters ?? 0);
          const distanceScore = Math.max(
            0,
            1 - distanceMeters / maxDistanceMeters,
          );

          rescuedEvents.push({
            ...candidate,
            sharedTags: fuzzyMatches.slice(0, 3),
            sharedTagCount: fuzzyMatches.length,
            baseScore: fuzzyMatches.length * 8 + distanceScore * 3,
            matchSource: "ai",
          });
        }
      }

      finalEvents = [...events, ...rescuedEvents];
    }

    finalEvents.sort((a: any, b: any) => {
      const aScore = a.relevanceScore ?? a.baseScore ?? 0;
      const bScore = b.relevanceScore ?? b.baseScore ?? 0;
      return bScore - aScore;
    });

    return NextResponse.json({
      events: finalEvents.slice(0, limit),
    });
  } catch (error) {
    console.error("Nearby events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby events" },
      { status: 500 },
    );
  }
}
