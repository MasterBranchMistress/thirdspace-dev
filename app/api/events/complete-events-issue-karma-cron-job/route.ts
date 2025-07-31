import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import { getUserRanking } from "@/utils/getRanking";

export async function PATCH() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const now = new Date();

    // find all active events that are in the past
    const expiredEvents = await eventsCollection
      .find({
        status: "active",
        date: { $lt: now },
      })
      .toArray();

    for (const event of expiredEvents) {
      const totalParticipants = (event.attendees?.length || 0) + 1; // include host
      if (totalParticipants >= 2) {
        // reward host
        const hostUpdate = await usersCollection.updateOne(
          { _id: new ObjectId(event.host) },
          { $inc: { eventsAttended: 1, eventsHosted: 1, karmaScore: 2 } }
        );
        const host = await usersCollection.findOne({
          _id: new ObjectId(event.host),
        });
        if (hostUpdate.acknowledged) {
          const badge = getUserRanking(
            host?.karmaScore ?? 50,
            host?.eventsAttended ?? 0
          );
          await usersCollection.updateOne(
            { _id: new ObjectId(event.host) },
            { $set: { qualityBadge: badge } }
          );
        }

        // reward each attendee
        if (event.attendees && event.attendees.length > 0) {
          for (const attendee of event.attendees) {
            const updatedUser = await usersCollection.updateOne(
              { _id: new ObjectId(attendee) },
              { $inc: { eventsAttended: 1, karmaScore: 1 } }
            );
            const user = await usersCollection.findOne({
              _id: new ObjectId(attendee),
            });
            if (updatedUser.acknowledged) {
              const badge = getUserRanking(
                user?.karmaScore ?? 100,
                user?.eventsAttended ?? 0
              );
              await usersCollection.updateOne(
                { _id: new ObjectId(attendee) },
                { $set: { qualityBadge: badge } }
              );
            }
          }
        }
      }

      // finally mark event as completed
      await eventsCollection.updateOne(
        { _id: new ObjectId(event._id) },
        { $set: { status: "completed" } }
      );
    }

    return NextResponse.json(
      { message: `✅ Auto-complete processed: ${expiredEvents.length} events` },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
