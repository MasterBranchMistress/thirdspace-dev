import clientPromise from "@/lib/mongodb";
import { NextResponse, NextRequest } from "next/server";
import { COLLECTIONS, DBS } from "@/lib/constants";

//Post new user account
export async function POST(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  try {
    const data = await req.json();
    const result = await db.collection(COLLECTIONS._USERS).insertOne(data);
    const newUser = await db
      .collection("users")
      .findOne({ _id: result.insertedId });
    return NextResponse.json(
      { message: "✅ New User Created", newUser },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
