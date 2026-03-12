import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { EventViewDoc, UserDoc } from "@/lib/models/User";
import { EventDoc } from "@/lib/models/Event";
import { error } from "console";

export async function POST(
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
  const eventViewDetails = db.collection<EventViewDoc>(
    COLLECTIONS._USER_EVENT_VIEWS,
  );
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });

  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const updateEventViewDetails = await eventViewDetails.updateOne(
    { _id: new ObjectId(eventId), viewerId: new ObjectId(viewerId._id) },
    {
      $set: { lastViewedAt: new Date(), hostId: event.host },
      $setOnInsert: { firstViewedAt: new Date() },
    },
    { upsert: true },
  );

  const updateEventViews = await eventCollection.updateOne(
    {
      _id: event._id,
    },
    {
      $inc: { views: 1 },
    },
  );

  if (!updateEventViews) return NextResponse.error();

  return NextResponse.json(
    {
      message: `View Added to ${event._id}`,
    },
    {
      status: 200,
    },
  );
}
