import { DBS, COLLECTIONS } from "@/lib/constants";
import { CommentDoc } from "@/lib/models/Comment";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // eventId
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  const body = await req.json();
  const { commentId, text } = body;

  if (!commentId || !text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const comments = db.collection<CommentDoc>(COLLECTIONS._COMMENTS);

  const result = await comments.updateOne(
    {
      _id: new ObjectId(String(commentId)),
      eventId: new ObjectId(id),
      userId: new ObjectId(userId),
    },
    { $set: { text, editedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Comment updated" });
}
