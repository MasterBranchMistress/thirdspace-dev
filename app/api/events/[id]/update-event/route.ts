import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { EventFeedDoc } from "@/lib/models/EventFeedDoc";
import detectMediaType from "@/utils/detect-media-type/detectMediaType";

function buildUpdateSnippet(changedFields: string[]) {
  if (changedFields.length === 0) return "Updated event details.";

  if (changedFields.length === 1) {
    const field = changedFields[0];

    if (field === "title") return `Updated Event Title.`;
    if (field === "description") return "Updated Event Description.";
    if (field === "date" || field === "startTime")
      return "Updated Event Date or Time.";
    if (field === "location") return "Updated event Location.";
    if (field === "attachments") return "Updated Event Media.";
    if (field === "tags") return "Updated Event Tags.";
  }

  if (changedFields.includes("date") || changedFields.includes("startTime")) {
    if (changedFields.includes("location")) {
      return "Updated Event Date, Time, or Location.";
    }
  }

  return "Updated event details.";
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const feedCollection = db.collection<EventFeedDoc>(COLLECTIONS._USER_FEED);

  try {
    const { hostId, updates } = await req.json();

    if (!hostId || typeof hostId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid hostId" },
        { status: 400 },
      );
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Missing or invalid updates" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
    }

    if (!ObjectId.isValid(hostId)) {
      return NextResponse.json({ error: "Invalid host id" }, { status: 400 });
    }

    const eventId = new ObjectId(id);
    const hostObjectId = new ObjectId(hostId);

    const existingEvent = await eventsCollection.findOne({ _id: eventId });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.host.toString() !== hostId) {
      return NextResponse.json(
        { error: "Only the host can update this event" },
        { status: 403 },
      );
    }

    const hostUser = await usersCollection.findOne({ _id: hostObjectId });
    if (!hostUser) {
      return NextResponse.json(
        { error: "Host user not found" },
        { status: 404 },
      );
    }

    const sanitizedUpdates: Record<string, any> = { ...updates };

    for (const key of Object.keys(sanitizedUpdates)) {
      const val = sanitizedUpdates[key];

      if (val === "" || val === null || val === undefined) {
        delete sanitizedUpdates[key];
        continue;
      }

      if (key === "date" && typeof val === "string" && val.trim() !== "") {
        const parsed = new Date(val);
        if (isNaN(parsed.getTime())) {
          delete sanitizedUpdates[key];
        } else {
          sanitizedUpdates[key] = parsed.toISOString();
        }
      }
    }

    const changedFields = Object.keys(sanitizedUpdates).filter((key) => {
      const prevValue = existingEvent[key as keyof EventDoc];
      const nextValue = sanitizedUpdates[key];
      return JSON.stringify(prevValue) !== JSON.stringify(nextValue);
    });

    if (changedFields.length === 0) {
      return NextResponse.json(existingEvent, { status: 200 });
    }

    sanitizedUpdates.updatedAt = new Date();

    const updateResult = await eventsCollection.updateOne(
      { _id: eventId },
      { $set: sanitizedUpdates },
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Event not found for update" },
        { status: 404 },
      );
    }

    const updatedEvent = await eventsCollection.findOne({ _id: eventId });
    if (!updatedEvent) {
      return NextResponse.json(
        { error: "Event not found after update" },
        { status: 404 },
      );
    }

    const now = new Date();
    const snippet = buildUpdateSnippet(changedFields);
    const parsedAttachments = updatedEvent.attachments?.map((url: string) => ({
      url,
      type: detectMediaType(url) || undefined,
    }));

    const attendeeIds = Array.isArray(updatedEvent.attendees)
      ? updatedEvent.attendees.map((id) => String(id))
      : [];

    if (attendeeIds.length > 0) {
      await usersCollection.updateMany(
        { _id: { $in: attendeeIds.map((id) => new ObjectId(id)) } },
        {
          $push: {
            notifications: {
              $each: [
                {
                  _id: updatedEvent._id,
                  message: `Event "${updatedEvent.title}" has been updated. Check in for details!`,
                  eventId: updatedEvent._id,
                  type: "updated",
                  timestamp: now,
                },
              ],
            },
          },
        },
      );
    }

    const recipientIds = Array.from(new Set([hostId, ...attendeeIds]));

    const feedDocs: Omit<EventFeedDoc, "_id">[] = recipientIds.map(
      (recipientId) => ({
        userId: new ObjectId(recipientId),
        sourceId: existingEvent.sourceId ?? new ObjectId().toString(),
        type: "updated_event",
        actor: {
          firstName: hostUser.firstName,
          lastName: hostUser.lastName,
          hostUser: hostUser.username!,
          avatar: hostUser.avatar,
          eventId: updatedEvent._id,
          eventName: updatedEvent.title,
          qualityBadge: hostUser.qualityBadge,
          karmaScore: hostUser.karmaScore,
        },
        target: {
          userId: hostUser._id,
          username: hostUser.username,
          host: hostUser.firstName!,
          title: updatedEvent.title,
          snippet: snippet,
          attachments: parsedAttachments,
          views: updatedEvent.views ?? 0,
          startingDate: new Date(updatedEvent.date).toISOString(),
          location: updatedEvent.location,
          qualityBadge: hostUser.qualityBadge,
          karmaScore: hostUser.karmaScore,
        },
        timestamp: now,
      }),
    );

    if (feedDocs.length > 0) {
      await feedCollection.insertMany(feedDocs);
    }

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
