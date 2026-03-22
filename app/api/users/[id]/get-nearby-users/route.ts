// app/api/users/[id]/get-nearby-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { UserDoc } from "@/lib/models/User";
import { getFuzzyMatchingTags } from "@/utils/tag-extractor/fuzzyTagMatcher";
import { serializeNearbyUser } from "@/utils/discoverability/serialize-users/serializeUsers";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = (await context.params).id;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const {
      radiusKm = 50,
      minShared = 1,
      limit = 20,
    } = await req.json().catch(() => ({}));

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const userCollection = db.collection(COLLECTIONS._USERS);

    const idx = await userCollection.indexes();
    if (!idx.some((i) => i.key?.["location.geo"] === "2dsphere")) {
      await userCollection.createIndex({ "location.geo": "2dsphere" });
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

    const blockedIds: ObjectId[] = Array.isArray(me?.blocked)
      ? me!.blocked
      : [];
    const followedAccounts: ObjectId[] = Array.isArray(me?.following)
      ? me.following
      : [];
    const friendedAccounts: ObjectId[] = Array.isArray(me?.friends)
      ? me.friends
      : [];

    if (!myPoint?.type || !Array.isArray(myPoint.coordinates)) {
      return NextResponse.json(
        { error: "User location not found" },
        { status: 404 },
      );
    }

    const excludeIds = [
      new ObjectId(userId),
      ...blockedIds,
      ...followedAccounts,
      ...friendedAccounts,
    ];
    const maxDistanceMeters = radiusKm * 1000;
    const effectiveMinShared = combinedTags.length === 0 ? 0 : minShared;

    const pipeline: any[] = [
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
        $addFields: {
          candidateCombinedTags: {
            $setUnion: [
              { $ifNull: ["$normalizedTags", []] },
              { $ifNull: ["$tagMatchKeys", []] },
            ],
          },
        },
      },
      {
        $addFields: {
          sharedTags: {
            $setIntersection: ["$candidateCombinedTags", combinedTags],
          },
          sharedCount: {
            $size: {
              $setIntersection: ["$candidateCombinedTags", combinedTags],
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
      { $match: { sharedCount: { $gte: effectiveMinShared } } },

      // base: tags dominate, distance supports
      {
        $addFields: {
          baseScore: {
            $add: [
              { $multiply: ["$sharedCount", 10] },
              { $multiply: ["$distanceScore", 3] },
            ],
          },
          karma01: { $divide: [{ $ifNull: ["$karmaScore", 0] }, 100] },
          karmaBoost: { $add: [1, { $multiply: ["$karma01", 0.15] }] },
        },
      },
      {
        $addFields: {
          matchScore: {
            $cond: [
              { $gt: ["$sharedCount", 0] },
              { $multiply: ["$baseScore", "$karmaBoost"] },
              "$baseScore",
            ],
          },
        },
      },

      {
        $project: {
          firstName: 1,
          lastName: 1,
          username: 1,
          avatar: 1,
          tags: 1,
          normalizedTags: 1,
          tagMatchKeys: 1,
          bio: 1,
          followers: 1,
          following: 1,
          friends: 1,
          location: 1,
          sharedTags: { $slice: ["$sharedTags", 3] },
          sharedCount: 1,
          distanceMeters: 1,
          matchScore: 1,
          karmaScore: 1,
          qualityBadge: 1,
        },
      },
      { $sort: { matchScore: -1, distanceMeters: 1 } },
      { $limit: Math.max(1, Math.min(limit, 100)) },
    ];

    const users = await db
      .collection(COLLECTIONS._USERS)
      .aggregate(pipeline)
      .toArray();

    const strongMatches = users.filter((u: any) => (u.sharedCount ?? 0) >= 2);

    const matchedTags = new Set(users.flatMap((u: any) => u.sharedTags ?? []));

    const unresolvedTags = combinedTags.filter((t) => !matchedTags.has(t));

    const shouldRunAI = strongMatches.length < 3 && unresolvedTags.length > 0;

    if (shouldRunAI) {
      const fallbackCandidates = await db
        .collection(COLLECTIONS._USERS)
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
            $project: {
              firstName: 1,
              lastName: 1,
              username: 1,
              avatar: 1,
              tags: 1,
              normalizedTags: 1,
              tagMatchKeys: 1,
              bio: 1,
              followers: 1,
              following: 1,
              friends: 1,
              location: 1,
              distanceMeters: 1,
              karmaScore: 1,
              qualityBadge: 1,
            },
          },
          { $limit: 30 },
        ])
        .toArray();

      const existingIds = new Set(users.map((u: any) => String(u._id)));
      const unresolvedCandidates = fallbackCandidates
        .filter((u: any) => !existingIds.has(String(u._id)))
        .slice(0, 10);

      const rescuedUsers = [];

      for (const candidate of unresolvedCandidates) {
        const candidateTags = Array.isArray(candidate.normalizedTags)
          ? candidate.normalizedTags
          : [];

        if (!candidateTags.length) continue;

        const fuzzyMatches = await getFuzzyMatchingTags(
          unresolvedTags,
          candidateTags,
        );

        if (fuzzyMatches.length > 1) {
          rescuedUsers.push({
            ...candidate,
            sharedTags: fuzzyMatches,
            sharedCount: fuzzyMatches.length,
            matchScore: fuzzyMatches.length * 2,
            matchSource: "ai",
          });
        }
      }

      const finalUsers = [...users, ...rescuedUsers]
        .sort((a: any, b: any) => {
          if ((b.matchScore ?? 0) !== (a.matchScore ?? 0)) {
            return (b.matchScore ?? 0) - (a.matchScore ?? 0);
          }
          return (
            (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)
          );
        })
        .slice(0, Math.max(1, Math.min(limit, 100)));

      return NextResponse.json({
        count: finalUsers.length,
        users: finalUsers.map(serializeNearbyUser),
      });
    }

    return NextResponse.json({
      count: users.length,
      users: users.map(serializeNearbyUser),
    });
  } catch (e: any) {
    console.error("Nearby users error:", e);
    return NextResponse.json(
      { error: "Failed to fetch nearby users" },
      { status: 500 },
    );
  }
}
