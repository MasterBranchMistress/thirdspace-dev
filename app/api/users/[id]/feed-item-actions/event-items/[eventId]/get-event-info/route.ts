import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

  const eventInfo = await eventCollection.findOne({
    _id: new ObjectId(eventId),
  });

  if (!eventInfo)
    return NextResponse.json({ message: "Event not found" }, { status: 404 });

  return NextResponse.json({ eventInfo: eventInfo }, { status: 200 });
}
