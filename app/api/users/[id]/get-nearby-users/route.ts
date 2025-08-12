// app/api/users/[id]/get-nearby-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    // 1) Load requester’s location + tags
    const me = await userCollection.findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { "location.geo": 1, tags: 1, blocked: 1 } }
    );

    const myPoint = me?.location?.geo;
    const myTags: string[] = Array.isArray(me?.tags) ? me!.tags : [];
    const blockedIds: ObjectId[] = Array.isArray(me?.blocked)
      ? me!.blocked
      : [];

    if (!myPoint?.type || !Array.isArray(myPoint.coordinates)) {
      return NextResponse.json(
        { error: "User location not found" },
        { status: 404 }
      );
    }

    // 2) Build pipeline
    const pipeline: any[] = [
      // Must be first for geo queries
      {
        $geoNear: {
          near: myPoint, // { type: "Point", coordinates: [lng, lat] }
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: radiusKm * 1000,
          query: {
            _id: { $ne: new ObjectId(userId), $nin: blockedIds }, // exclude self & blocked
            "location.geo": { $exists: true },
          },
        },
      },
      // Compute overlap with my tags
      {
        $addFields: {
          sharedTags: { $setIntersection: ["$tags", myTags] },
          sharedCount: {
            $size: {
              $ifNull: [{ $setIntersection: ["$tags", myTags] }, []],
            },
          },
        },
      },
      // Filter by minimum overlap
      { $match: { sharedCount: { $gte: minShared } } },
      // Simple scoring (more shared tags + closer distance is better)
      {
        $addFields: {
          // Example score:  weight tags higher than distance
          matchScore: {
            $add: [
              { $multiply: ["$sharedCount", 10] }, // 10 pts per shared tag
              {
                $multiply: [
                  { $divide: [1, { $add: ["$distanceMeters", 1] }] },
                  5000,
                ],
              }, // inverse distance
            ],
          },
        },
      },
      // Project only what you need
      {
        $project: {
          firstName: 1,
          lastName: 1,
          username: 1,
          avatar: 1,
          tags: 1,
          location: 1,
          sharedTags: 1,
          sharedCount: 1,
          distanceMeters: 1,
          matchScore: 1,
        },
      },
      // Sort by your score, then distance as tiebreaker
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
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        avatar: u.avatar,
        tags: u.tags ?? [],
        sharedTags: u.sharedTags ?? [],
        sharedCount: u.sharedCount ?? 0,
        distanceMiles: u.distanceMeters
          ? +(u.distanceMeters / 1609.344).toFixed(1)
          : null,
        locationName: u.location?.name ?? null,
      })),
    });
  } catch (e: any) {
    console.error("Nearby users error:", e);
    return NextResponse.json(
      { error: "Failed to fetch nearby users" },
      { status: 500 }
    );
  }
}
