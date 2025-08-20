// app/api/users/[id]/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DBS, COLLECTIONS } from "@/lib/constants";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const users = db.collection(COLLECTIONS._USERS);

    const user = await users.findOne(
      { _id: new ObjectId(String(id)) },
      { projection: { avatar: 1 } }
    );

    if (!user?.avatar?.publicUrl) {
      return NextResponse.json({ error: "No avatar found" }, { status: 404 });
    }

    return NextResponse.json({ publicUrl: user.avatar.publicUrl });
  } catch (err) {
    console.error("Error fetching avatar:", err);
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    );
  }
}
