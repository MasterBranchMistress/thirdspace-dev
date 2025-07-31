import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // event id
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    // read hostId from body for now (later: derive from session)
    const { hostId } = await req.json();

    if (!hostId) {
      return NextResponse.json({ error: "Missing hostId" }, { status: 400 });
    }

    // find event
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // check permission
    if (event.host.toString() !== hostId) {
      return NextResponse.json(
        { error: "Only the host can delete this event" },
        { status: 403 }
      );
    }

    // delete event
    const deleteResult = await eventsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }

    const usersCollection = await db.collection<UserDoc>(COLLECTIONS._USERS);

    await usersCollection.updateMany(
      { _id: { $in: event.attendees } },
      {
        $push: {
          notifications: {
            $each: [
              {
                _id: event._id,
                message: `Event "${event.title}" has been deleted.`,
                eventId: event._id,
                type: `removed`,
                timestamp: new Date(),
              },
            ],
          },
        },
      }
    );

    // then delete the event
    await eventsCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { message: "✅ Event deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
