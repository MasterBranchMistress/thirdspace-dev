import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // event id
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { callerId, notifId } = await req.json();

    // ✅ validate inputs
    if (!callerId || typeof callerId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid callerId" },
        { status: 400 }
      );
    }

    if (!callerId || callerId !== id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(String(callerId)) },
      { $pull: { notifications: { _id: new ObjectId(String(notifId)) } } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
