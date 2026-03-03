import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { CommentDoc } from "@/lib/models/Comment";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const commentsCollection = db.collection<CommentDoc>(
    COLLECTIONS._STATUS_COMMENTS,
  );

  try {
    const body = await req.json();

    // ✅ Whitelist & validate
    const userId = typeof body.userId === "string" ? body.userId : null;
    const text = typeof body.text === "string" ? body.text.trim() : null;

    if (!userId || !text || text.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ✅ Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 },
      );
    }

    // ✅ ensure event exists
    const status = await statusCollection.findOne({ _id: new ObjectId(id) });
    if (!status) {
      return NextResponse.json(
        { message: "status not found" },
        { status: 404 },
      );
    }

    //check for user
    const user = await userCollection.findOne({
      _id: new ObjectId(String(userId)),
    });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (text.length > 500) {
      return NextResponse.json(
        { message: "Message too long" },
        { status: 400 },
      );
    }

    const newComment = {
      _id: new ObjectId(),
      statusId: new ObjectId(id),
      userId: new ObjectId(String(userId)),
      commenter: {
        userId: String(user._id),
        avatar: user.avatar,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      text,
      timestamp: new Date(),
      parentCommentId: body.parentCommentId
        ? new ObjectId(String(body.parentCommentId))
        : undefined,
      sparks: 0,
      likes: 0,
    };

    await commentsCollection.insertOne(newComment);

    // ✅ Return only the new comment
    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
