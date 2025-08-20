import { COLLECTIONS, DBS } from "@/lib/constants";
import clientPromise from "@/lib/mongodb";

export async function syncUserUsername(userId: string, newUsername: string) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  const feeds = [COLLECTIONS._USER_FEED, COLLECTIONS._EVENT_FEED];

  for (const collection of feeds) {
    await db
      .collection(collection)
      .updateMany(
        { "actor.id": userId },
        { $set: { "actor.username": newUsername } }
      );
  }

  console.log(`Synced username for ${userId} -> ${newUsername} across feeds`);
}
