import { DBS, COLLECTIONS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; notifId: string }> }
) {
  const { id, notifId } = await context.params; // ✅ no await
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { read } = await req.json();

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id), "notifications._id": new ObjectId(notifId) },
      { $set: { "notifications.$.read": !!read } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Notification updated" },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
