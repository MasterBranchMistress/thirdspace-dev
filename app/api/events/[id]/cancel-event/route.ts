import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // event id
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const { userId } = await req.json(); // host id from request body
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ find event
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ check host permission
    if (event.host.toString() !== userId) {
      return NextResponse.json(
        { error: "Not authorized — only host can cancel" },
        { status: 403 }
      );
    }

    // ✅ check if already canceled/completed
    if (event.status === EVENT_STATUSES._CANCELED) {
      return NextResponse.json(
        { error: "Event is already canceled" },
        { status: 400 }
      );
    }
    if (event.status === EVENT_STATUSES._COMPLETED) {
      return NextResponse.json(
        { error: "Event is already completed" },
        { status: 400 }
      );
    }

    // ✅ update status
    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: EVENT_STATUSES._CANCELED } }
    );

    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

    // after setting event.status = "canceled" send notification
    await userCollection.updateMany(
      { _id: { $in: event.attendees } },
      {
        $push: {
          notifications: {
            _id: event._id,
            message: `Event "${event.title}" has been canceled.`,
            eventId: event._id,
            type: "canceled",
            timestamp: new Date(),
          },
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ fetch updated event
    const updatedEvent = await eventsCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
