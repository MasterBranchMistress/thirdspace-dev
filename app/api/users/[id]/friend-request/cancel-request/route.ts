import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { recipientId } = await req.json();

  if (!recipientId) {
    return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "Missing senderId" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const users = db.collection<UserDoc>(COLLECTIONS._USERS);
    const recipient = await users.findOne({
      _id: new ObjectId(String(recipientId)),
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    await users.updateOne(
      {
        _id: new ObjectId(String(recipientId)),
      },
      {
        $pull: { pendingFriendRequestsIncoming: new ObjectId(String(id)) },
      }
    );
    await users.updateOne(
      {
        _id: new ObjectId(String(id)),
      },
      {
        $pull: {
          pendingFriendRequestsOutgoing: new ObjectId(String(recipientId)),
        },
      }
    );

    return NextResponse.json(
      { message: "Friend request canceled" },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
