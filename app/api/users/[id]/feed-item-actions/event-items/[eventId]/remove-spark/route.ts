import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { EventSparkDoc, EventViewDoc, UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { error } from "console";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; eventId: string }> },
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id, eventId } = await context.params;

  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = await userCollection.findOne({ _id: new ObjectId(id) });
  console.log("Viewer session: ", viewerId);
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
  const updateEventSparkDetails = await eventSparkDetails.deleteOne({
    eventId: new ObjectId(eventId),
    sparkerId: new ObjectId(viewerId._id),
  });

  if (updateEventSparkDetails.deletedCount === 1) {
    await eventCollection.updateOne(
      {
        _id: event._id,
      },
      {
        $pull: { sparks: new ObjectId(viewerId._id) },
      },
    );
  } else {
    return NextResponse.json({ message: "User hasn't sparked this event" });
  }

  return NextResponse.json(
    {
      message: `Spark deleted from ${event._id}`,
    },
    {
      status: 200,
    },
  );
}
