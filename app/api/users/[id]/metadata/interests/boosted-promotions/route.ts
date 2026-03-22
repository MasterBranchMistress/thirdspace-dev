import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserFeedDoc } from "@/lib/models/UserFeedDoc";

type Body = { statusIds: string[] };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const userFeedCollection = db.collection<UserFeedDoc>(
      COLLECTIONS._USER_FEED,
    );

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booster = session.user;

    if (!ObjectId.isValid(booster.id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rawIds = Array.isArray(body.statusIds) ? body.statusIds : [];

    const validObjectIds = rawIds
      .map((id) => id.split(":")[0])
      .filter(ObjectId.isValid)
      .map((id) => new ObjectId(id));

    if (validObjectIds.length === 0) {
      return NextResponse.json({ boostedPromotionIds: [] }, { status: 200 });
    }

    const boostedPromotions = await userFeedCollection
      .find(
        {
          type: "user_promoted",
          "boostedBy.id": new ObjectId(booster.id),
        },
        {
          projection: { _id: 1, userId: 1, sourceId: 1 },
        },
      )
      .toArray();

    return NextResponse.json(
      {
        boostedPromotionIds: boostedPromotions.map((doc) =>
          String(doc.sourceId),
        ),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("boosted-promotions POST error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
