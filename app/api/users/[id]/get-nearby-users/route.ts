// app/api/users/[id]/get-nearby-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { UserDoc } from "@/lib/models/User";

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
      radiusKm = 25,
      minShared = 1,
      limit = 20,
    } = await req.json().catch(() => ({}));

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const userCollection = db.collection(COLLECTIONS._USERS);
    userCollection.createIndex({ "location.geo": "2dsphere" });
    userCollection.createIndex({ tags: 1 });

    const idx = await userCollection.indexes();
    if (!idx.some((i) => i.key?.["location.geo"] === "2dsphere")) {
      await userCollection.createIndex({ "location.geo": "2dsphere" });
    }

    // 1) Load requester’s location + tags
    const me = await userCollection.findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { "location.geo": 1, tags: 1, blocked: 1 } },
    );

    const myPoint = me?.location?.geo;
    const myTags: string[] = Array.isArray(me?.tags) ? me!.tags : [];
    const blockedIds: ObjectId[] = Array.isArray(me?.blocked)
      ? me!.blocked
      : [];

    if (!myPoint?.type || !Array.isArray(myPoint.coordinates)) {
      return NextResponse.json(
        { error: "User location not found" },
        { status: 404 },
      );
    }

    const excludeIds = [new ObjectId(userId), ...blockedIds];
    const maxDistanceMeters = radiusKm * 1000;
    const effectiveMinShared = myTags.length === 0 ? 0 : minShared;

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
          sharedTags: { $setIntersection: ["$tags", myTags] },
          sharedCount: {
            $size: { $ifNull: [{ $setIntersection: ["$tags", myTags] }, []] },
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

    return NextResponse.json({
      count: users.length,
      users: users.map((u) => ({
        id: String(u._id),
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        avatar: u.avatar,
        followers: Array.isArray(u.followers)
          ? u.followers.map((id: ObjectId) => String(id))
          : [],
        following: Array.isArray(u.following)
          ? u.following.map((id: ObjectId) => String(id))
          : [],
        friends: Array.isArray(u.friends)
          ? u.friends.map((id: ObjectId) => String(id))
          : [],
        tags: Array.isArray(u.tags) ? u.tags : [],
        bio: u.bio,
        location: u.location,
        distanceMeters: u.distanceMeters,
        sharedTags: Array.isArray(u.sharedTags) ? u.sharedTags : [],
        sharedCount: u.sharedCount ?? 0,
        qualityBadge: u.qualityBadge,
      })),
    });
  } catch (e: any) {
    console.error("Nearby users error:", e);
    return NextResponse.json(
      { error: "Failed to fetch nearby users" },
      { status: 500 },
    );
  }
}
