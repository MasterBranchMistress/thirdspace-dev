import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const body = await req.json();

    // ✅ Whitelist & validate
    const userId = typeof body.userId === "string" ? body.userId : null;
    const text = typeof body.text === "string" ? body.text.trim() : null;

    if (!userId || !text || text.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // ✅ Extra safety: block keys starting with '$' or containing '.'
    if (/\$|\./.test(userId) || /\$|\./.test(text)) {
      return NextResponse.json(
        { error: "Invalid characters in input" },
        { status: 400 }
      );
    }

    // ✅ Validate userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // ✅ ensure event exists
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === EVENT_STATUSES._CANCELED) {
      return NextResponse.json({ error: "Event is canceled" }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const newMessage = {
      user: new ObjectId(String(userId)),
      text,
      timestamp: new Date(),
    };

    await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { messages: newMessage } }
    );

    const updatedEvent = await eventsCollection.findOne({
      _id: new ObjectId(id),
    });
    return NextResponse.json(
      { messages: updatedEvent?.messages ?? [] },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
