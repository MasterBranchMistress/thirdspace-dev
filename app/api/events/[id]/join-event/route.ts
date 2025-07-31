import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await db
      .collection(COLLECTIONS._USERS)
      .findOne({ _id: new ObjectId(String(userId)) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // optional: check that event exists and is not canceled
    const event = await eventCollection.findOne({ _id: new ObjectId(id) });

    //check if user is banned
    if (event?.banned?.some((b) => b.toString() === userId)) {
      return NextResponse.json(
        { error: "You are banned from this event." },
        { status: 403 }
      );
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === EVENT_STATUSES._CANCELED) {
      return NextResponse.json({ error: "Event is canceled" }, { status: 400 });
    }
    if (event.status === EVENT_STATUSES._COMPLETED) {
      return NextResponse.json(
        {
          message: "Event has been completed",
        },
        { status: 400 }
      );
    }

    const hostUser = await userCollection.findOne({
      _id: new ObjectId(event.host),
    });
    if (!hostUser) {
      return NextResponse.json({ error: "Host not found" });
    }

    // If host has blocked this joining user
    if (hostUser?.blocked?.some((b) => b.toString() === userId)) {
      const joiningUser = await userCollection.findOne({
        _id: new ObjectId(String(userId)),
      });

      if (joiningUser && event.public) {
        // if event is public, allow it through
        await userCollection.updateOne(
          { _id: new ObjectId(event.host) },
          {
            $push: {
              notifications: {
                $each: [
                  {
                    _id: new ObjectId(),
                    message: `${joiningUser.name} (a blocked user) has joined your event "${event.title}".`,
                    eventId: event._id,
                    type: "blocked_user_joined_event",
                    timestamp: new Date(),
                  },
                ],
              },
            },
          }
        );
      } else {
        //private event, add to ban list and return
        await eventCollection.updateOne(
          { _id: event._id },
          { $addToSet: { banned: new ObjectId(String(userId)) } }
        );
        return NextResponse.json(
          { error: "User has been banned from this event" },
          { status: 403 }
        );
      }
    }

    // add user to attendees, avoiding duplicates
    const updateResult = await db
      .collection(COLLECTIONS._EVENTS)
      .updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { attendees: new ObjectId(String(userId)) } }
      );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const updatedEvent = await db
      .collection(COLLECTIONS._EVENTS)
      .findOne({ _id: new ObjectId(id) });
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
