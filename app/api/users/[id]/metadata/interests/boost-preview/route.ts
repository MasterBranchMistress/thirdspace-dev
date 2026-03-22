import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";
import { avatar } from "@heroui/react";

export type PreviewUser = {
  id: string;
  firstName: string;
  avatar?: string;
};

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const promotionIdsRaw: string[] = Array.isArray(body.promotionIds)
      ? body.promotionIds
      : [];

    const limitPerTarget = Math.max(
      1,
      Math.min(Number(body.limitPerTarget ?? 3), 5),
    );

    const promotedUserIds = promotionIdsRaw
      .map((id) => String(id).split(":")[0].trim())
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (!promotedUserIds.length) {
      return NextResponse.json({ promotion: {} }, { status: 200 });
    }

    const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
    const userFeedCollection = db.collection<UserFeedDoc>(
      COLLECTIONS._USER_FEED,
    );

    const promotionDocs = await userFeedCollection
      .find(
        {
          userId: { $in: promotedUserIds },
          type: "user_promoted",
        },
        {
          projection: {
            _id: 1,
            sourceId: 1,
            boostedBy: 1,
          },
        },
      )
      .toArray();

    const promotionByTarget = new Map<string, string[]>();

    for (const doc of promotionDocs) {
      const targetId = String(doc.sourceId);
      const boostedByRaw = Array.isArray(doc.boostedBy) ? doc.boostedBy : [];

      const ids = boostedByRaw
        .map((boosted: any) => String(boosted.id).trim())
        .filter((id) => ObjectId.isValid(id))
        .slice(0, limitPerTarget);

      promotionByTarget.set(targetId, ids);
    }

    const previewUserIds = Array.from(
      new Set(Array.from(promotionByTarget.values()).flat()),
    ).filter((id) => ObjectId.isValid(id));

    const previewUsers = previewUserIds.length
      ? await usersCollection
          .find(
            {
              _id: {
                $in: previewUserIds.map((id) => new ObjectId(id)),
              },
            },
            {
              projection: {
                _id: 1,
                firstName: 1,
                avatar: 1,
              },
            },
          )
          .toArray()
      : [];

    const userMap = new Map<string, PreviewUser>();
    for (const u of previewUsers) {
      userMap.set(String(u._id), {
        id: String(u._id),
        firstName: u.firstName ?? "Explorer",
        avatar: u.avatar,
      });
    }

    const promotion: Record<string, PreviewUser[]> = {};

    for (const [targetId, ids] of Array.from(promotionByTarget.entries())) {
      promotion[targetId] = ids
        .map((id) => userMap.get(id))
        .filter(Boolean) as PreviewUser[];
    }

    return NextResponse.json({ promotion: promotion }, { status: 200 });
  } catch (err) {
    console.error("boost-preview POST error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
