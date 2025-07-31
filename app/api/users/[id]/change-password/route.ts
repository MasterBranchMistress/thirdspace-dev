// File: /api/users/[id]/change-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { verifyPassword, hashPassword, isAuthorized } from "@/utils/auth";
import { UserDoc } from "@/lib/models/User";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);
  const users = db.collection<UserDoc>(COLLECTIONS._USERS);

  try {
    const { callerId, currentPassword, newPassword } = await req.json();

    //TODO: change to new function in auth.ts
    if (!isAuthorized(callerId, id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current and new passwords are required" },
        { status: 400 }
      );
    }

    const user = await users.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must include a number and an uppercase letter" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
