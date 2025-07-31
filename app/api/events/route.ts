import { COLLECTIONS, DBS, EVENT_STATUSES } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const data = await req.json();

    // ✅ Validate required fields
    if (
      !data.title ||
      !data.date ||
      !data.host ||
      !data.description ||
      !data.location
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Build base event
    const baseEvent: EventDoc = {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      startTime: data.startTime,
      location: data.location,
      host: new ObjectId(String(data.host)),
      attendees: [],
      tags: data.tags || [],
      status: EVENT_STATUSES._ACTIVE,
      public: data.public ?? true,
      recurring: data.recurring ?? false,
      recurrenceRule: data.recurrenceRule,
      recurrenceEndDate: data.recurrenceEndDate,
      budgetInfo: data.budgetInfo,
    };

    // ✅ Insert base event and grab its ID
    const result = await eventCollection.insertOne(baseEvent);

    // ✅ Generate occurrences if recurring
    if (data.recurring) {
      const occurrences: EventDoc[] = [];
      const currentDate = new Date(data.date);

      const numOccurrences = data.numOccurrences ?? 5;
      const rule = data.recurrenceRule || "weekly";

      for (let i = 0; i < numOccurrences; i++) {
        // increment date
        if (rule === "weekly") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (rule === "daily") {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (rule === "monthly") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // push a new event instance
        occurrences.push({
          title: data.title,
          description: data.description,
          date: new Date(currentDate),
          startTime: data.startTime,
          location: data.location,
          host: new ObjectId(String(data.host)),
          attendees: [],
          tags: data.tags || [],
          status: EVENT_STATUSES._ACTIVE,
          public: data.public ?? true,
          recurring: false, // instances themselves don’t recur
          parentEventId: result.insertedId, // ✅ link back to base
        } as EventDoc);
      }

      if (occurrences.length > 0) {
        await eventCollection.insertMany(occurrences);
      }
    }

    return NextResponse.json(
      { message: "✅ Event(s) created", eventId: result.insertedId },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
