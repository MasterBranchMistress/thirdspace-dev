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
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { hostId, userId, alsoUnfriend, alsoBlock } = await req.json();

    if (!hostId || !userId) {
      return NextResponse.json(
        { error: "Missing hostId or userId" },
        { status: 400 }
      );
    }
    const user = await userCollection.findOne({
      _id: new ObjectId(String(hostId)),
    });
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ verify requester is the host
    if (event.host.toString() !== hostId) {
      return NextResponse.json(
        { error: "Only the host can ban users" },
        { status: 403 }
      );
    }

    if (event.public) {
      return NextResponse.json(
        {
          error:
            "Unable to ban user from public event. Please set to private before banning",
        },
        { status: 400 }
      );
    }

    if (alsoUnfriend) {
      if (user.friends?.some((c) => c.toString() === userId)) {
        await userCollection.updateOne(
          { _id: new ObjectId(String(hostId)) },
          { $pull: { friends: new ObjectId(String(userId)) } }
        );
        await userCollection.updateOne(
          { _id: new ObjectId(String(userId)) },
          { $pull: { friends: new ObjectId(String(hostId)) } }
        );
      } else {
        return NextResponse.json(
          { error: "User is not on friends list" },
          { status: 400 }
        );
      }
    }

    if (alsoBlock) {
      if (!user.blocked?.some((c) => c.toString() === userId)) {
        await userCollection.updateOne(
          { _id: new ObjectId(String(hostId)) },
          { $addToSet: { blocked: new ObjectId(String(userId)) } }
        );
      } else {
        return NextResponse.json(
          { error: "User is already blocked" },
          { status: 400 }
        );
      }
    }

    // ✅ remove from attendees
    if (event.attendees.some((c) => c.toString() === userId)) {
      await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { attendees: new ObjectId(String(userId)) } }
      );

      // ✅ add to banned list
      await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { banned: new ObjectId(String(userId)) } }
      );

      return NextResponse.json(
        { message: "User banned from event" },
        { status: 200 }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
