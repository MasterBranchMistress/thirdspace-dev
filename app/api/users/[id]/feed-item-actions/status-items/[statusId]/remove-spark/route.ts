import { COLLECTIONS, DBS } from "@/lib/constants";
import { StatusSparkDoc, UserDoc, UserStatusDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; statusId: string }> },
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id, statusId } = await context.params;

  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = await userCollection.findOne({ _id: new ObjectId(id) });

  if (!viewerId) {
    return NextResponse.json({ error: "User not logged in" }, { status: 404 });
  }

  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const statusSparkDetails = db.collection<StatusSparkDoc>(
    COLLECTIONS._USER_STATUS_SPARKS,
  );
  const status = await statusCollection.findOne({
    _id: new ObjectId(statusId),
  });

  if (!status)
    return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const deleteRes = await statusSparkDetails.deleteOne({
    statusId: new ObjectId(statusId),
    sparkerId: new ObjectId(viewerId._id),
  });

  if (deleteRes.deletedCount !== 1) {
    return NextResponse.json(
      { error: "unable to remove spark" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, hasSparked: false, changed: deleteRes.deletedCount === 1 },
    { status: 200 },
  );
}
