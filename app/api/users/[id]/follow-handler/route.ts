//follow handler both ways

import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id } = await context.params;
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const viewerId = session?.user.id;
  if (!viewerId) {
    return NextResponse.json({ error: "User not logged in" }, { status: 404 });
  }

  const user = await userCollection.findOne({ _id: new ObjectId(id) });
  const viewer = await userCollection.findOne({
    _id: new ObjectId(String(viewerId)),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!viewer) {
    return NextResponse.json({ error: "Viewer not found" }, { status: 404 });
  }
  const userIsFollowingViewer = user.followers?.some(
    (followerId) => followerId.toString() === viewerId
  );
  if (userIsFollowingViewer) {
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { followers: new ObjectId(String(viewerId)) } }
    );
    await userCollection.updateOne(
      { _id: new ObjectId(viewerId) },
      { $pull: { following: new ObjectId(String(id)) } }
    );

    return NextResponse.json(
      { message: "User has unfollowed succcessfully" },
      { status: 200 }
    );
  } else {
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { followers: new ObjectId(String(viewerId)) } }
    );
    await userCollection.updateOne(
      { _id: new ObjectId(viewerId) },
      { $addToSet: { following: new ObjectId(String(id)) } }
    );
    return NextResponse.json({
      message: "Successfully following user",
    });
  }
}
