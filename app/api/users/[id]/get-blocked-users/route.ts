// GET /api/users/[id]/blocked
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const users = db.collection(COLLECTIONS._USERS);
    const { id } = await context.params;

    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch minimal info for each blocked user
    const blockedUsers = await users
      .find({ _id: { $in: user.blocked || [] } })
      .project({ _id: 1, firstName: 1, lastName: 1, avatar: 1 })
      .toArray();

    return NextResponse.json(
      blockedUsers.map((u) => ({
        id: u._id.toString(),
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatar,
      }))
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
