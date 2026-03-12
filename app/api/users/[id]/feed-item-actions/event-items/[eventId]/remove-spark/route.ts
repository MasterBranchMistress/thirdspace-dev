import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { EventSparkDoc, EventViewDoc, UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { error } from "console";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; eventId: string }> },
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id, eventId } = await context.params;

  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = await userCollection.findOne({ _id: new ObjectId(id) });

  if (!viewerId) {
    return NextResponse.json({ error: "User not logged in" }, { status: 404 });
  }

  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const eventSparkDetails = db.collection<EventSparkDoc>(
    COLLECTIONS._USER_EVENT_SPARKS,
  );
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const deleteRes = await eventSparkDetails.deleteOne({
    eventId: new ObjectId(eventId),
    sparkerId: new ObjectId(viewerId._id),
  });

  if (deleteRes.deletedCount !== 1) {
    return NextResponse.json(
      { error: "Unable to remove spark" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, hasSparked: false, changed: deleteRes.deletedCount === 1 },
    { status: 200 },
  );
}
