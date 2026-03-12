import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS, KARMA_CAPS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getUserRanking } from "@/utils/karma/getRanking";

async function applyKarmaAndBadge(
  usersCollection: ReturnType<any>,
  userId: string,
  increments: {
    eventsAttended?: number;
    eventsHosted?: number;
    karmaScore?: number;
  },
) {
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $inc: increments },
  );

  const user = await usersCollection.findOne({
    _id: new ObjectId(userId),
  });

  if (!user) return;

  const badge = getUserRanking(user.karmaScore ?? 0);

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { qualityBadge: badge } },
  );
}

export async function PATCH() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const now = new Date();

    const expiredEvents = await eventsCollection
      .find({
        status: "active",
        date: { $lt: now },
      })
      .toArray();

    for (const event of expiredEvents) {
      const attendeeCount = event.attendees?.length ?? 0;
      const totalParticipants = attendeeCount + 1;

      if (totalParticipants >= 2) {
        await applyKarmaAndBadge(usersCollection, event.host.toString(), {
          eventsAttended: 1,
          eventsHosted: 1,
          karmaScore: KARMA_CAPS.HOSTED_EVENT_DAILY,
        });

        for (const attendee of event.attendees ?? []) {
          await applyKarmaAndBadge(usersCollection, attendee.toString(), {
            eventsAttended: 1,
            karmaScore: KARMA_CAPS.ATTENDED_EVENT_DAILY,
          });
        }
      }

      await eventsCollection.updateOne(
        { _id: event._id },
        { $set: { status: "completed" } },
      );
    }

    return NextResponse.json(
      { message: `✅ Auto-complete processed: ${expiredEvents.length} events` },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
