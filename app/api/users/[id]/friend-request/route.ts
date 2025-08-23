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

    if (!user) {
      return NextResponse.json({ error: "Missing Valid User" });
    }

    if (user.blocked?.some((uniqueUser) => uniqueUser.toString() === fromId)) {
      return NextResponse.json(
        { error: "User is blocked. Unable to send friend request" },
        { status: 400 }
      );
    }
    if (user.friends?.some((uniqueUser) => uniqueUser.toString() === fromId)) {
      return NextResponse.json(
        { error: "User is already in friends list" },
        { status: 400 }
      );
    }
    const sentFriendRequest = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { pendingFriendRequests: new ObjectId(String(fromId)) } }
    );

    const sender = await userCollection.findOne({
      _id: new ObjectId(String(fromId)),
    });

    if (sender) {
      await userCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $push: {
            notifications: {
              $each: [
                {
                  _id: new ObjectId(),
                  actorId: sender._id,
                  avatar: sender.avatar,
                  message: `${sender.firstName} ${sender.lastName} sent you a friend request.`,
                  eventId: new ObjectId(),
                  type: "received_friend_request",
                  timestamp: new Date(),
                },
              ],
            },
          },
        }
      );
    }

    return NextResponse.json(
      { message: "Friend request sent!", sentFriendRequest },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
