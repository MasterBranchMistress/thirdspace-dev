import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid event ID", code: "INVALID_EVENT_ID" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

    const eventId = new ObjectId(id);

    const event = await eventCollection.findOne({ _id: eventId });

    if (!event) {
      return NextResponse.json(
        { message: "Event not found", code: "EVENT_NOT_FOUND" },
        { status: 404 },
      );
    }

    const hostUser = event.hostId
      ? await userCollection.findOne({ _id: new ObjectId(event.hostId) })
      : null;

    let attendeeUsers: UserDoc[] = [];
    if (event.attendees?.length) {
      attendeeUsers = await userCollection
        .find({
          _id: {
            $in: event.attendees.map((a) => new ObjectId(a)),
          },
        })
        .toArray();
    }

    const responseEvent = {
      ...event,
      _id: event._id.toString(),
      host: hostUser
        ? {
            _id: hostUser._id.toString(),
            firstName: hostUser.firstName,
            lastName: hostUser.lastName,
            avatar: hostUser.avatar,
            username: hostUser.username,
          }
        : null,
      attendees: attendeeUsers.map((a) => ({
        _id: a._id?.toString(),
        firstName: a.firstName,
        lastName: a.lastName,
        avatar: a.avatar,
        username: a.username,
      })),
    };

    return NextResponse.json(responseEvent, { status: 200 });
  } catch (error: any) {
    console.error("[getEvent]", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch event" },
      { status: 500 },
    );
  }
}
