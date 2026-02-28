import { COLLECTIONS, DBS } from "@/lib/constants";
import { StatusSparkDoc, UserDoc, UserStatusDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; statusId: string }> },
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id, statusId } = await context.params;

  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = await userCollection.findOne({ _id: new ObjectId(id) });
  console.log("Viewer session: ", viewerId);
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
  const updateStatusSparkDetails = await statusSparkDetails.updateOne(
    { _id: new ObjectId(statusId), sparkerId: new ObjectId(viewerId._id) },
    {
      $set: { lastViewedAt: new Date(), authorId: status.userId },
      $setOnInsert: { firstViewedAt: new Date() },
    },
    { upsert: true },
  );

  const updateEventSparks = await statusCollection.updateOne(
    {
      _id: status._id,
    },
    {
      $inc: { sparks: 1 },
    },
  );
  if (!updateEventSparks) return NextResponse.error();

  return NextResponse.json(
    {
      message: `Spark Added to ${status._id}`,
    },
    {
      status: 200,
    },
  );
}
