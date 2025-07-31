import { COLLECTIONS, DBS } from "@/lib/constants";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id } = await context.params;
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { friendId } = await req.json();
    if (!friendId) {
      return NextResponse.json({ error: "Friend not found." }, { status: 404 });
    }

    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    const friend = await userCollection.findOne({
      _id: new ObjectId(String(friendId)),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }
    if (!user.friends?.some((frnd) => frnd.toString() === friendId)) {
      return NextResponse.json(
        { error: "This user is not a part of the friends list" },
        { status: 400 }
      );
    }

    // ✅ remove friend from user list
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { friends: new ObjectId(String(friendId)) } }
    );

    // ✅ remove user from friend's friend list
    await userCollection.updateOne(
      { _id: new ObjectId(String(friendId)) },
      { $pull: { friends: new ObjectId(id) } }
    );

    const updatedResult = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(updatedResult, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
