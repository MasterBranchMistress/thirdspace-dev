import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { EventSparkDoc, EventViewDoc, UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { error } from "console";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; eventId: string }> },
) {
  const session = await getServerSession(authOptions);
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id, eventId } = await context.params;

  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = await userCollection.findOne({ _id: new ObjectId(id) });

  if (!session?.user.id) {
    return NextResponse.json({ error: "User not logged in" }, { status: 404 });
  }

  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const eventSparkDetails = db.collection<EventSparkDoc>(
    COLLECTIONS._USER_EVENT_SPARKS,
  );
  const event = await eventCollection.findOne({ _id: new ObjectId(eventId) });
  if (!event)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const updateEventSparkDetails = await eventSparkDetails.updateOne(
    {
      eventId: new ObjectId(eventId),
      sparkerId: new ObjectId(session.user.id),
    },
    {
      $set: { lastViewedAt: new Date(), hostId: event.host },
      $setOnInsert: { firstViewedAt: new Date() },
    },
    { upsert: true },
  );

  return NextResponse.json(
    {
      message: `Spark Added to ${event._id}`,
    },
    {
      status: 200,
    },
  );
}
