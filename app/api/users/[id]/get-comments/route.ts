import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { CommentDoc } from "@/lib/models/Comment";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const commentsCollection = db.collection<CommentDoc>(COLLECTIONS._COMMENTS);

  try {
    // ✅ validate id format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
    }

    // ✅ find event
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ✅ Step 2: get all comments linked to this event
    const comments = await commentsCollection
      .find({ eventId: new ObjectId(event._id) })
      .sort({ timestamp: 1 })
      .toArray();

    // ✅ Step 3: build nested tree
    const map: Record<string, any> = {};
    comments.forEach((c) => (map[c._id.toString()] = { ...c, replies: [] }));

    const tree: any[] = [];
    comments.forEach((c) => {
      if (c.parentCommentId) {
        map[c.parentCommentId.toString()]?.replies.push(map[c._id.toString()]);
      } else {
        tree.push(map[c._id.toString()]);
      }
    });

    return NextResponse.json({ comments: tree }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
