import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id } = await context.params;
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { fromId } = await req.json();

    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    const sender = await userCollection.findOne({
      _id: new ObjectId(String(fromId)),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" });
    }

    const senderIsInPendingRequests = user.pendingFriendRequests?.some(
      (c) => c.toString() === fromId
    );

    if (senderIsInPendingRequests) {
      await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { pendingFriendRequests: new ObjectId(String(fromId)) } }
      );
    }

    // ✅ add to friends (both ways)
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { friends: new ObjectId(String(fromId)) } }
    );
    await userCollection.updateOne(
      { _id: new ObjectId(String(fromId)) },
      { $addToSet: { friends: new ObjectId(id) } }
    );

    await userCollection.updateOne(
      { _id: new ObjectId(String(fromId)) },
      {
        $push: {
          notifications: {
            $each: [
              {
                _id: new ObjectId(),
                message: `${user.name} accepted your friend request.`,
                eventId: new ObjectId(),
                type: "accepted_friend_request",
                timestamp: new Date(),
              },
            ],
          },
        },
      }
    );

    return NextResponse.json(
      { message: "Friend request accepted!" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
