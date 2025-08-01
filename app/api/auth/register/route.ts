import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hashPassword, generateAnonUsername } from "@/utils/auth";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { ObjectId } from "mongodb";
import { getGravatarUrl } from "@/utils/gravatar";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();
    const missing = [];
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing field(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const users = db.collection<UserDoc>(COLLECTIONS._USERS);

    const existing = await users.findOne({ email });
    if (existing)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Password must include a number and uppercase letter" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const baseUserDefaults: Omit<
      UserDoc,
      "firstName" | "lastName" | "email" | "username" | "passwordHash" | "_id"
    > = {
      provider: "credentials",
      avatar: getGravatarUrl(email),
      interests: [],
      bio: "",
      favoriteLocations: [],
      availibility: [],
      friends: [],
      blocked: [],
      pendingFriendRequests: [],
      notifications: [],
      isAdmin: false,
      karmaScore: 100,
      qualityBadge: "bronze",
      eventsAttended: 0,
      eventsHosted: 0,
      lastMinuteCancels: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: "",
      lang: "en",
      tags: [],
      usernameLastChangedAt: new Date(),
    };

    const newUser: UserDoc = {
      _id: new ObjectId(),
      firstName,
      lastName,
      email,
      username: generateAnonUsername(),
      passwordHash,
      ...baseUserDefaults,
    };

    await users.insertOne(newUser);

    return NextResponse.json(
      {
        message: `Profile ${firstName} successfuly registered!`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
