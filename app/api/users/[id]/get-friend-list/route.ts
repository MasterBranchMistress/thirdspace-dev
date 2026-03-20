import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
// adjust these imports to your project
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = await userCollection.findOne({
      _id: new ObjectId(session.user.id),
    });
    const friendIds: ObjectId[] = me?.friends ?? [];
    const friends = await userCollection
      .find(
        {
          _id: { $in: friendIds },
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

    if (!friendIds.length) {
      return NextResponse.json({ status: {}, event: {} }, { status: 200 });
    }

    return NextResponse.json({ friends: friends }, { status: 200 });
  } catch (err) {
    return err as Error;
  }
}
