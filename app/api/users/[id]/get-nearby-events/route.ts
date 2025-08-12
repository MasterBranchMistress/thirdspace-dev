import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { Collection } from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = (await context.params).id;
  try {
    const { radiusKm = 10 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const eventCollection = db.collection(COLLECTIONS._EVENTS);
    const userCollection = db.collection(COLLECTIONS._USERS);
    eventCollection.createIndex({ "location.geo": "2dsphere" });
    userCollection.createIndex({ "location.geo": "2dsphere" });

    // Get user location
    const user = await db
      .collection(COLLECTIONS._USERS)
      .findOne({ _id: new ObjectId(userId) }, { projection: { location: 1 } });

    if (!user?.location) {
      return NextResponse.json(
        { error: "User location not found" },
        { status: 404 }
      );
    }

    const { lat, lng } = user.location;

    // Query nearby events
    const events = await db
      .collection(COLLECTIONS._EVENTS)
      .find({
        "location.geo": {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000, // meters
          },
        },
      })
      .toArray();

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Nearby events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby events" },
      { status: 500 }
    );
  }
}
