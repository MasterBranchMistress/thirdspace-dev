import { COLLECTIONS, DBS } from "@/lib/constants";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { EventDoc } from "@/lib/models/Event";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id } = await context.params;
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const { blockUserId } = await req.json();

    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    const blockedUser = await userCollection.findOne({
      _id: new ObjectId(String(blockUserId)),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!blockedUser) {
      return NextResponse.json(
        { error: "Unable to block: User not found" },
        { status: 404 }
      );
    }

    if (
      user.blocked?.some((uniqueUser) => uniqueUser.toString() === blockUserId)
    ) {
      return NextResponse.json(
        { error: "User is already blocked" },
        { status: 400 }
      );
    }

    // ✅ remove friend from user list
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { blocked: new ObjectId(String(blockUserId)) } }
    );

    if (user.friends?.some((frnd) => frnd.toString() === blockUserId)) {
      await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { friends: new ObjectId(String(blockUserId)) } }
      );
    }

    if (blockedUser.friends?.some((frnd) => frnd.toString() === id)) {
      await userCollection.updateOne(
        { _id: new ObjectId(String(blockUserId)) },
        { $pull: { friends: new ObjectId(id) } }
      );
    }

    // ✅ Remove blocked user from all events where blocker is the host
    await eventCollection.updateMany(
      {
        host: new ObjectId(id),
        attendees: new ObjectId(String(blockUserId)), // only events where they are an attendee
      },
      {
        $pull: { attendees: new ObjectId(String(blockUserId)) },
      }
    );

    const updateResult = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(updateResult, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
