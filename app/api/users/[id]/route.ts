import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { canViewerSee } from "@/utils/user-privacy/canViewerSee";
import { UserDoc } from "@/lib/models/User";
import { isUserBlocked } from "@/utils/user-privacy/isUserBlocked";

/**
 * GET /api/users/:id
 * Fetch a user's profile by ID
 */

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ error: "🙅 No users found" }, { status: 404 });
    }

    // get viewer session
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    const viewer = await userCollection.findOne({
      _id: new ObjectId(viewerId),
    });

    if (isUserBlocked(user, viewer)) {
      return NextResponse.json({ error: "🙅 Profile hidden" }, { status: 403 });
    }
    return NextResponse.json(
      { message: "Found User: ", user },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

//delete user account

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  try {
    const result = await db
      .collection(COLLECTIONS._USERS)
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User and all events have been deleted",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

//patch user account

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  try {
    const updates = await req.json();

    const result = await db
      .collection(COLLECTIONS._USERS)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
