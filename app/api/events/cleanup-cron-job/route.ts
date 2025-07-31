import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";

export async function DELETE() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const result = await eventsCollection.deleteMany({
      status: {
        $in: [
          EVENT_STATUSES._COMPLETED,
          EVENT_STATUSES._REMOVED,
          EVENT_STATUSES._CANCELED,
        ],
      },
    });

    return NextResponse.json(
      {
        message: `✅ Cleanup complete`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
