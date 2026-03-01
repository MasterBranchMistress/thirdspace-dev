import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
// adjust these imports to your project
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";

type Body = { eventIds: string[] };

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

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rawIds = Array.isArray(body.eventIds) ? body.eventIds : [];

    const validObjectIds = rawIds
      .filter(ObjectId.isValid)
      .map((id) => new ObjectId(id));

    if (validObjectIds.length === 0) {
      return NextResponse.json({ sparkedEventIds: [] }, { status: 200 });
    }

    const eventSparks = await eventCollection
      .find({
        sparkerId: new ObjectId(sparkerId),
        eventId: { $in: validObjectIds },
      })
      .toArray();

    return NextResponse.json(
      { sparkedEventIds: eventSparks.map((s: any) => String(s.eventId)) },
      { status: 200 },
    );
  } catch (err) {
    return err as Error;
  }
}
