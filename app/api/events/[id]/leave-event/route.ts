import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { EventDoc } from "@/lib/models/Event";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { getUserRanking } from "@/utils/getRanking";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ event id from URL
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const { userId } = await req.json(); // ✅ user id from body
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ verify user exists
    const user = await userCollection.findOne({
      _id: new ObjectId(String(userId)),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ verify event exists and is not canceled

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
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
    // ✅ check if user is in attendees
    const isAttending = event.attendees.some(
      (attendeeId) => attendeeId.toString() === userId
    );
    if (!isAttending) {
      return NextResponse.json(
        { error: "User is not an attendee of this event" },
        { status: 400 }
      );
    }

    // ✅ remove user from attendees
    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { attendees: new ObjectId(String(userId)) } }
    );

    //determine karma
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLastMinute = diffHours < 24;

    if (isLastMinute) {
      const updatedUser = await userCollection.updateOne(
        { _id: new ObjectId(String(userId)) },
        { $inc: { karmaScore: -10, lastMinuteCancels: 1 } }
      );
      //get user ranking if breaking some threshold
      if (updatedUser.acknowledged) {
        const badge = getUserRanking(
          user.karmaScore ?? 50,
          user.eventsAttended ?? 0
        );
        await userCollection.updateOne(
          { _id: new ObjectId(String(userId)) },
          { $set: { qualityBadge: badge } }
        );
      }
    }

    //✅ send notification to event host
    await userCollection.updateOne(
      { _id: new ObjectId(event.host) },
      {
        $push: {
          notifications: {
            _id: new ObjectId(),
            message: `${user.firstName} ${user.lastName} left your event: ${event.title}`,
            avatar: user.avatar,
            eventId: event._id,
            type: "user_left_event",
            timestamp: new Date(),
            read: false,
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
