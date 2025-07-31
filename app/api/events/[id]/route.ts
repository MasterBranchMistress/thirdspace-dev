import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";

// for testing
// title: { type: String, required: true },
// description: { type: String, required: true },
// date: { type: Date, required: true },
// location: {
//       name: { type: String },
//       lat: { type: Number },
//       lng: { type: Number },
//     },
// host: { type: Types.ObjectId, ref: "User", required: true },
// attendes: [{ type: Types.ObjectId, ref: "User" }],
// tags: [{ type: String }],
// messages: [MessageSchema],
//   },
//   { timestamps: true }

/* Get Event */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const { id } = await context.params;

  try {
    const event = await db
      .collection(COLLECTIONS._EVENTS)
      .findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
