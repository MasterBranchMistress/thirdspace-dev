import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

  const statusInfo = await statusCollection.findOne({ sourceId: statusId });

  if (!statusInfo)
    return NextResponse.json({ error: "Status not found" }, { status: 404 });

  return NextResponse.json({ statusInfo: statusInfo }, { status: 200 });
}
