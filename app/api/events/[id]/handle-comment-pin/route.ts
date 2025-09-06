import { DBS, COLLECTIONS } from "@/lib/constants";
import { CommentDoc } from "@/lib/models/Comment";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { EventDoc } from "@/lib/models/Event";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // eventId
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  const { commentId } = await req.json();

  if (!ObjectId.isValid(commentId)) {
    return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const comments = db.collection<CommentDoc>(COLLECTIONS._COMMENTS);
  const event = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  //Get Comment
  const comment = await comments.findOne({
    _id: new ObjectId(String(commentId)),
    eventId: new ObjectId(id),
  });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  //check for event
  const eventDoc = await event.findOne({ _id: new ObjectId(id) });
  if (!eventDoc) {
    return NextResponse.json(
      { error: "Event does not exist" },
      { status: 404 }
    );
  }

  //check if user is the host
  if (String(userId) !== String(eventDoc.host)) {
    return NextResponse.json(
      { error: "Only the host can pin/unpin comments" },
      { status: 403 }
    );
  }

  /* Because I didn't want to create a new endpoint for unpinning comments, 
  I just made the logic so that 
  if the comment is already pinned, 
  calling this endpoint again will unpin it, and vice versa. */

  if (comment.pinned) {
    // unpin this one
    await comments.updateOne(
      { _id: comment._id },
      { $set: { pinned: false }, $unset: { pinnedAt: "" } }
    );
  } else {
    // unpin all others first
    await comments.updateMany(
      { eventId: new ObjectId(id), pinned: true },
      { $set: { pinned: false }, $unset: { pinnedAt: "" } }
    );

    // then pin this one
    await comments.updateOne(
      { _id: comment._id },
      { $set: { pinned: true, pinnedAt: new Date() } }
    );
  }

  return NextResponse.json({ message: "Comment pinned/unpinned" });
}
