import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // userId
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    // ✅ mark all notifications as read
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { "notifications.$[].read": true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found or no notifications" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "✅ All notifications marked as read" },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
