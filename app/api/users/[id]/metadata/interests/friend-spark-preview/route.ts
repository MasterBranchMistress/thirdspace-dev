import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { getFriendIdsForUser } from "@/utils/metadata/get-friends-for-user/getFriendList";

type Body = { postIds: string[] };
export type PreviewUser = { id: string; firstName: string; avatar?: string };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const eventCollection = db.collection(COLLECTIONS._USER_EVENT_SPARKS);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sparkerId = session?.user.id;

    if (!ObjectId.isValid(sparkerId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();

    const statusIdsRaw: string[] = Array.isArray(body.statusIds)
      ? body.statusIds
      : [];
    const eventIdsRaw: string[] = Array.isArray(body.eventIds)
      ? body.eventIds
      : [];
    const limitPerTarget = Math.max(
      1,
      Math.min(Number(body.limitPerTarget ?? 2), 3),
    );

    // 2) parse ids
    const statusIds = statusIdsRaw
      .filter(ObjectId.isValid)
      .map((x) => new ObjectId(x));
    const eventIds = eventIdsRaw
      .filter(ObjectId.isValid)
      .map((x) => new ObjectId(x));

    const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const eventSparksCollection = db.collection(COLLECTIONS._USER_EVENT_SPARKS);
    const statusSparksCollection = db.collection(
      COLLECTIONS._USER_STATUS_SPARKS,
    );

    // 3) get friend ids (you’ll implement this based on your relationships model)
    // Example: friendIds: ObjectId[]
    const friendIds: ObjectId[] = await getFriendIdsForUser(db, session.user);
    if (!friendIds.length) {
      return NextResponse.json({ status: {}, event: {} }, { status: 200 });
    }

    // 4) query sparks
    const statusSparkDocs = statusIds.length
      ? await statusSparksCollection
          .find(
            { statusId: { $in: statusIds }, sparkerId: { $in: friendIds } },
            { projection: { _id: 0, statusId: 1, sparkerId: 1 } },
          )
          .toArray()
      : [];

    const eventSparkDocs = eventIds.length
      ? await eventSparksCollection
          .find(
            { eventId: { $in: eventIds }, sparkerId: { $in: friendIds } },
            { projection: { _id: 0, eventId: 1, sparkerId: 1 } },
          )
          .toArray()
      : [];

    // 5) group by target + cap
    const statusByTarget = new Map<string, string[]>(); // targetId -> [sparkerId...]
    for (const d of statusSparkDocs) {
      const tid = String(d.statusId);
      const sid = String(d.sparkerId);
      const arr = statusByTarget.get(tid) ?? [];
      if (arr.length < limitPerTarget && !arr.includes(sid)) arr.push(sid);
      statusByTarget.set(tid, arr);
    }

    const eventByTarget = new Map<string, string[]>();
    for (const d of eventSparkDocs) {
      const tid = String(d.eventId);
      const sid = String(d.sparkerId);
      const arr = eventByTarget.get(tid) ?? [];
      if (arr.length < limitPerTarget && !arr.includes(sid)) arr.push(sid);
      eventByTarget.set(tid, arr);
    }

    // 6) batch fetch user preview docs
    const previewUserIds = new Set<string>([
      ...Array.from(statusByTarget.values()).flat(),
      ...Array.from(eventByTarget.values()).flat(),
    ]);

    const previewUsers = previewUserIds.size
      ? await usersCollection
          .find(
            {
              _id: {
                $in: Array.from(previewUserIds).map((x) => new ObjectId(x)),
              },
            },
            { projection: { _id: 1, firstName: 1, avatar: 1 } },
          )
          .toArray()
      : [];

    const userMap = new Map<string, PreviewUser>();
    for (const u of previewUsers) {
      userMap.set(String(u._id), {
        id: String(u._id),
        firstName: u.firstName ?? "Friend",
        avatar: u.avatar,
      });
    }

    // 7) build response maps
    const status: Record<string, PreviewUser[]> = {};
    for (const [tid, ids] of Array.from(statusByTarget.entries())) {
      status[tid] = ids
        .map((id) => userMap.get(id))
        .filter(Boolean) as PreviewUser[];
    }

    const event: Record<string, PreviewUser[]> = {};
    for (const [tid, ids] of Array.from(eventByTarget.entries())) {
      event[tid] = ids
        .map((id) => userMap.get(id))
        .filter(Boolean) as PreviewUser[];
    }

    console.log(
      "friendIds",
      friendIds.length,
      "statusSparkDocs",
      statusSparkDocs.length,
      "eventSparkDocs",
      eventSparkDocs.length,
    );
    return NextResponse.json({ status, event }, { status: 200 });
  } catch (err) {
    console.error("friend-preview POST error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
