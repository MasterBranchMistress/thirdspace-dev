import { COLLECTIONS, DBS } from "@/lib/constants";
import clientPromise from "@/lib/mongodb";

export async function syncUserAvatar(userId: string, avatarUrl: string) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  for (const collectionName of [
    COLLECTIONS._USER_FEED,
    COLLECTIONS._EVENT_FEED,
  ]) {
    const coll = db.collection(collectionName);
    await coll.updateMany(
      { "actor.id": userId },
      { $set: { "actor.avatar": avatarUrl } }
    );
  }
}
