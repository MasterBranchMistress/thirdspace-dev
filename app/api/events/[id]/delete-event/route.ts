import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // event id
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    // ✅ get session user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // find event
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // check permission (only host can delete)
    if (event.host.toString() !== userId) {
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

    //Remove evnt from everyones feed

    const userFeedCollection = db.collection(COLLECTIONS._USER_FEED);
    const eventFeedCollection = db.collection(COLLECTIONS._EVENT_FEED);

    await Promise.all([
      userFeedCollection.deleteMany({ "target._id": new ObjectId(id) }),
      eventFeedCollection.deleteMany({ "target._id": new ObjectId(id) }),
    ]);

    // notify attendees
    const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

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
                type: "removed",
                timestamp: new Date(),
              },
            ],
          },
        },
      }
    );

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
