import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { validateAvailability } from "@/utils/validateScheduleData";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // userId from URL
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { availability, callerId } = await req.json();

    // ✅ verify caller matches the URL param
    if (!callerId || callerId !== id) {
      return NextResponse.json(
        { error: "Not authorized to update this user's schedule" },
        { status: 403 }
      );
    }

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: "Invalid availability format" },
        { status: 400 }
      );
    }
    const validation = validateAvailability(availability);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { availibility: availability } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
