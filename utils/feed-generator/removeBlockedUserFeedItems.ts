import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";

export async function removeBlockedUserFeedItems(
  blockerId: string,
  blockedId: string
): Promise<{ userFeedRemoved: number; eventFeedRemoved: number }> {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  const userFeedCollection = db.collection(COLLECTIONS._USER_FEED);
  const eventFeedCollection = db.collection(COLLECTIONS._EVENT_FEED);

  const blockerObjectId = new ObjectId(blockerId);
  const blockedObjectId = new ObjectId(blockedId);

  const filter = {
    userId: { $in: [blockerObjectId, blockedObjectId] },
    $or: [
      { "actor.id": blockedId },
      { "actor.id": blockerId },
      { "target.userId": blockedObjectId },
      { "target.userId": blockerObjectId },
    ],
  };

  const [userRes, eventRes] = await Promise.all([
    userFeedCollection.deleteMany(filter),
    eventFeedCollection.deleteMany(filter),
  ]);

  return {
    userFeedRemoved: userRes.deletedCount ?? 0,
    eventFeedRemoved: eventRes.deletedCount ?? 0,
  };
}
