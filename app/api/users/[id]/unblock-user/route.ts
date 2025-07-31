import { COLLECTIONS, DBS } from "@/lib/constants";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // user performing unblock
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { unblockUserId } = await req.json();
    if (!unblockUserId) {
      return NextResponse.json(
        { error: "Missing unblockUserId" },
        { status: 400 }
      );
    }

    // ✅ verify user exists
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ check if currently blocked
    if (!user.blocked?.some((b) => b.toString() === unblockUserId)) {
      return NextResponse.json(
        { error: "User is not blocked" },
        { status: 400 }
      );
    }

    // ✅ pull from blocked array
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { blocked: new ObjectId(unblockUserId) } }
    );

    // ✅ fetch updated user
    const updatedUser = await userCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
