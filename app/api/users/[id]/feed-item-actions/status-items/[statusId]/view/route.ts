import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS, STATUS_CONSTANT } from "@/lib/constants";
import { StatusViewDoc, UserDoc, UserStatusDoc } from "@/lib/models/User";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth/next";

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
  const statuscollectionViewDetails = db.collection<StatusViewDoc>(
    COLLECTIONS._USER_STATUS_VIEWS,
  );
  const [statusPost, statusViewer] = await Promise.all([
    statusCollection.findOne({ sourceId: statusId }),
    userCollection.findOne({ _id: new ObjectId(viewerId._id) }),
  ]);
  const now = new Date(); // to throttle view count

  const existingPost = await statuscollectionViewDetails.findOne({
    sourceId: statusId,
    viewerId: new ObjectId(viewerId._id),
  });

  if (existingPost?.lastViewedAt) {
    const msSince =
      now.getTime() - new Date(existingPost.lastViewedAt).getTime();
    const minutesSince = msSince / (1000 * 60);

    if (minutesSince < STATUS_CONSTANT._THROTTLE_MINUTES) {
      await statuscollectionViewDetails.updateOne(
        { sourceId: statusId },
        { $set: { lastViewedAt: now } },
      );

      return NextResponse.json({ ok: true, throttled: true }, { status: 200 });
    }
  }

  if (!statusPost) {
    return NextResponse.json({ error: "Status not found" }, { status: 404 });
  }
  if (!statusViewer) {
    return NextResponse.json({ error: "Viewer not found" }, { status: 404 });
  }
  if (!statusPost) {
    return NextResponse.json({ error: "Status not found", status: 404 });
  }

  const updateStatusViewDetails = await statuscollectionViewDetails.updateOne(
    { sourceId: statusId, viewerId: new ObjectId(viewerId._id) },
    {
      $set: { lastViewedAt: now, authorId: statusPost.userId },
      $setOnInsert: { firstViewedAt: now },
    },
    { upsert: true },
  );
  const updateStatusViews = await statusCollection.updateOne(
    {
      _id: statusPost._id,
    },
    {
      $inc: { views: 1 },
    },
  );
  if (!updateStatusViewDetails) return NextResponse.error();
  if (!updateStatusViews) return NextResponse.error();
  return NextResponse.json(
    {
      message: "View Added",
    },
    {
      status: 200,
    },
  );
}
