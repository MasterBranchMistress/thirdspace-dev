import { COLLECTIONS, DBS } from "@/lib/constants";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc, UserStatusDoc } from "@/lib/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const statusCollection = db.collection<UserStatusDoc>(
    COLLECTIONS._USER_STATUSES,
  );
  const userCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    console.log("Source Id: ", id);
    const status = await statusCollection.findOne({ sourceId: id });
    if (!status || status.isDeleted) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }
    const author = await userCollection.findOne({
      userId: status.userId,
    });

    const responseEvent = {
      ...status,
      _id: status._id,
      host: author
        ? {
            _id: author._id,
            firstName: author.firstName,
            lastName: author.lastName,
            avatar: author.avatar,
            username: author.username,
            karmaScore: author.karmaScore,
          }
        : null,
    };

    return NextResponse.json(responseEvent, { status: 200 });
  } catch (error: any) {
    console.error("[getEvent]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
