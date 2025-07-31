import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { availability: user.availibility ?? [] },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
