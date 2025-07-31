import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // event ID from URL
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { hostId, updates } = await req.json();

    // ✅ validate inputs
    if (!hostId || typeof hostId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid hostId" },
        { status: 400 }
      );
    }
    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid updates" },
        { status: 400 }
      );
    }

    // ✅ get existing event
    const existingEvent = await eventsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ ensure host matches
    if (existingEvent.host.toString() !== hostId) {
      return NextResponse.json(
        { error: "Only the host can update this event" },
        { status: 403 }
      );
    }

    // ✅ perform update
    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Event not found for update" },
        { status: 404 }
      );
    }

    // ✅ fetch the updated event
    const updatedEvent = await eventsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!updatedEvent) {
      return NextResponse.json(
        { error: "Event not found after update" },
        { status: 404 }
      );
    }

    // ✅ notify attendees
    if (updatedEvent.attendees) {
      await usersCollection.updateMany(
        { _id: { $in: updatedEvent.attendees } },
        {
          $push: {
            notifications: {
              $each: [
                {
                  _id: updatedEvent._id,
                  message: `Event "${updatedEvent.title}" has been updated. Check in for details!.`,
                  eventId: updatedEvent._id,
                  type: `updated`,
                  timestamp: new Date(),
                },
              ],
            },
          },
        }
      );
    }

    // ✅ return updated event
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
