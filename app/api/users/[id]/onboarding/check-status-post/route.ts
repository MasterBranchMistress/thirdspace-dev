import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);
  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const eventCollection = db.collection<EventDoc>(COLLECTIONS._EVENTS);

  try {
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const status = await statusCollection.findOne({
      userId: user._id,
    });
    const event = await eventCollection.findOne({
      host: user._id,
    });

    if (!status && !event) {
      return NextResponse.json({ postedStatus: false }, { status: 200 });
    }

    return NextResponse.json(
      { postedStatus: true, status: status, event: event },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
