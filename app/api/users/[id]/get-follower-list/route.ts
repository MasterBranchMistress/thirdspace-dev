import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

    const user = await userCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followerIds: ObjectId[] = user.followers ?? [];

    if (!followerIds.length) {
      return NextResponse.json({ followers: [] }, { status: 200 });
    }

    const followers = await userCollection
      .find(
        {
          _id: { $in: followerIds },
        },
        {
          projection: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            avatar: 1,
          },
        },
      )
      .toArray();

    return NextResponse.json({ followers }, { status: 200 });
  } catch (err) {
    console.error("Get user followers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
