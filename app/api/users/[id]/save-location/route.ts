import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { location } = await req.json();
    if (!location?.lat || !location?.lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    await db.collection(COLLECTIONS._USERS).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          location: {
            lat: location.lat,
            lng: location.lng,
            name: location.name || "", // optional
          },
          locationLastUpdatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: "✅ Location updated" });
  } catch (error: any) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
