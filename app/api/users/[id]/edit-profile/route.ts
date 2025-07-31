import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { isAuthorized } from "@/utils/auth";

const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { callerId, ...updates } = await req.json();

    if (!isAuthorized(callerId, id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateFields: Partial<UserDoc> = {};

    // ✅ Username change with cooldown
    if (updates.username && updates.username !== user.username) {
      if (user.usernameLastChangedAt) {
        const elapsed =
          Date.now() - new Date(user.usernameLastChangedAt).getTime();
        if (elapsed < THREE_MONTHS_MS) {
          const daysRemaining = Math.ceil(
            (THREE_MONTHS_MS - elapsed) / (1000 * 60 * 60 * 24)
          );
          return NextResponse.json(
            {
              error: `You can update your username again in ${daysRemaining} day(s)`,
            },
            { status: 429 }
          );
        }
      }
      updateFields.username = updates.username.trim();
      updateFields.usernameLastChangedAt = new Date();
    }

    // ✅ Bio: max 150 characters
    if (typeof updates.bio === "string") {
      const trimmedBio = updates.bio.trim();
      if (trimmedBio.length > 150) {
        return NextResponse.json(
          { error: "Bio must be 150 characters or fewer." },
          { status: 400 }
        );
      }
      updateFields.bio = trimmedBio;
    }
    if (typeof updates.avatar === "string")
      updateFields.avatar = updates.avatar.trim();

    if (typeof updates.location === "string")
      updateFields.location = updates.location.trim();

    if (typeof updates.lang === "string")
      updateFields.lang = updates.lang.trim();

    // ✅ Tags: max 5 items
    if (Array.isArray(updates.tags)) {
      if (updates.tags.length > 5) {
        return NextResponse.json(
          { error: "You can only select up to 5 tags." },
          { status: 400 }
        );
      }
      updateFields.tags = updates.tags.map((t: string) =>
        t.trim().toLowerCase()
      );
    }

    // ✅ Optional editable fields
    if (typeof updates.avatar === "string")
      updateFields.avatar = updates.avatar;
    if (typeof updates.location === "string")
      updateFields.location = updates.location;
    if (typeof updates.lang === "string") updateFields.lang = updates.lang;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No updates provided." },
        { status: 200 }
      );
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: "Profile updated" }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
