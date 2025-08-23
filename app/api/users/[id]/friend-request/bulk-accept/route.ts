import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { requesterIds } = await req.json();

    if (
      !requesterIds ||
      !Array.isArray(requesterIds) ||
      requesterIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid or missing requesterIds" },
        { status: 400 }
      );
    }

    const userId = new ObjectId(id);
    const requesterObjectIds = requesterIds.map(
      (uid: string) => new ObjectId(uid)
    );

    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const validRequesters: ObjectId[] = requesterObjectIds.filter((rid) =>
      user.pendingFriendRequests?.some(
        (pendingId) => pendingId.toString() === rid.toString()
      )
    );

    console.log("Requestors array?", validRequesters);

    if (validRequesters.length === 0) {
      return NextResponse.json(
        { error: "No valid friend requests found" },
        { status: 400 }
      );
    }

    // ✅ Update user: add friends, remove pending
    await usersCollection.updateOne(
      { _id: userId },
      {
        $addToSet: { friends: { $each: validRequesters } },
        $pull: {
          pendingFriendRequests: {
            $in: validRequesters,
          },
        } as never,
      }
    );

    // ✅ Update requesters: add user as friend, send notification
    await Promise.all(
      validRequesters.map((rid) =>
        usersCollection.updateOne(
          { _id: rid },
          {
            $addToSet: { friends: userId },
            $push: {
              notifications: {
                _id: new ObjectId(),
                actorId: user._id,
                message: `${user.firstName} ${user.lastName} has accepted your friend request`,
                type: "accepted_friend_request",
                timestamp: new Date(),
                read: false,
              },
            },
          }
        )
      )
    );

    return NextResponse.json({
      message: `✅ ${validRequesters.length} friend request(s) accepted.`,
      acceptedIds: validRequesters.map((id) => id.toString()),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
