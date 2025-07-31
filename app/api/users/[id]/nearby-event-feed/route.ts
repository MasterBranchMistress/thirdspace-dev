import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";

export async function GET(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const eventsCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const skip = (page - 1) * limit;

    const maxCost = searchParams.get("maxCost");
    // optional future geo
    // const lat = searchParams.get("lat");
    // const lng = searchParams.get("lng");
    // const radius = searchParams.get("radius");

    const filter: Record<string, unknown> = {
      public: true,
      status: "active",
      date: { $gte: new Date() },
    };
    if (maxCost !== null) {
      filter["budgetInfo.estimatedCost"] = { $lte: Number(maxCost) };
    }

    const [events, total] = await Promise.all([
      eventsCollection
        .find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      eventsCollection.countDocuments(filter),
    ]);

    return NextResponse.json({
      message: "✅ Public events fetched",
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
