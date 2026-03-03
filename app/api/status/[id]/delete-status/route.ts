import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { UserStatusDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }, // status sourceId
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing status id" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const feedCollection = db.collection(COLLECTIONS._USER_FEED);
  const commentcollection = db.collection(COLLECTIONS._STATUS_COMMENTS);
  const sparksCollection = db.collection(COLLECTIONS._USER_STATUS_SPARKS);

  const status = await statusCollection.findOne({ sourceId: id });

  // Return 404 if missing OR already deleted (idempotent + avoids leaking)
  if (!status || (status as any).isDeleted) {
    return NextResponse.json({ error: "Status not found" }, { status: 404 });
  }

  // Ownership check
  if (String(status.userId) !== String(user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // (You can return 404 instead if you prefer not to leak existence)
  }

  // Soft delete the status
  const updateRes = await statusCollection.deleteOne({ sourceId: id });

  if (updateRes.deletedCount !== 1) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  // Remove from feed (IMPORTANT: adjust filter to your feed schema)
  await feedCollection.deleteMany({
    type: "profile_status_updated",
    sourceId: id,
  });
  await commentcollection.deleteMany({
    statusId: new ObjectId(id),
  });
  await sparksCollection.deleteMany({
    statusId: new ObjectId(id),
  });
  return NextResponse.json({ message: "Status deleted" }, { status: 200 });
}
