import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
// adjust these imports to your project
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";

type Body = { statusIds: string[] };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const sparkCollection = db.collection(COLLECTIONS._USER_STATUS_SPARKS);
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

    const rawIds = Array.isArray(body.statusIds) ? body.statusIds : [];

    const validObjectIds = rawIds
      .filter(ObjectId.isValid)
      .map((id) => new ObjectId(id));

    if (validObjectIds.length === 0) {
      return NextResponse.json({ sparkedStatusIds: [] }, { status: 200 });
    }

    const statusSparks = await sparkCollection
      .find({
        sparkerId: new ObjectId(sparkerId),
        statusId: { $in: validObjectIds },
      })
      .toArray();

    return NextResponse.json(
      { sparkedStatusIds: statusSparks.map((s: any) => String(s.statusId)) },
      { status: 200 },
    );
  } catch (err) {
    return err as Error;
  }
}
