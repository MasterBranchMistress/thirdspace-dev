import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { CommentDoc } from "@/lib/models/Comment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // eventId
) {
  const { id } = await context.params; // eventId
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const commentsCollection = db.collection<CommentDoc>(COLLECTIONS._COMMENTS);

  try {
    const body = await req.json();
    const commentId = body.commentId;
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;

    if (!commentId || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
    }
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // Make sure the comment exists and belongs to the event
    const existing = await commentsCollection.findOne({
      _id: new ObjectId(String(commentId)),
      eventId: new ObjectId(id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only the comment owner or event host can delete
    if (
      String(existing.userId) !== String(userId) &&
      String(existing.commenter.userId) !== String(userId)
    ) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // Decided to go with a soft delete here just so the conversation can be kept for other users
    await commentsCollection.updateOne(
      { _id: new ObjectId(String(commentId)) },
      { $set: { deleted: true, deletedAt: new Date() } }
    );

    return NextResponse.json(
      { message: "Comment marked as deleted", commentId },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
