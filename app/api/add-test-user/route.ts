import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { AUTH_PROVIDERS, DBS } from "@/lib/constants";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  // Generate fake availability (e.g., for a few random days)
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const randomAvailability = Array.from({
    length: faker.number.int({ min: 1, max: 3 }),
  }).map(() => {
    const day = faker.helpers.arrayElement(daysOfWeek);
    const start = faker.helpers.arrayElement(["09:00", "13:00", "18:00"]);
    const end = faker.helpers.arrayElement(["11:00", "15:00", "20:00"]);
    return { day, times: [{ start, end }] };
  });

  // Build the fake user doc
  const user = {
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    username: faker.internet.displayName(),
    email: faker.internet.email(),
    passwordHash: faker.internet.password({ memorable: false }),
    avatar: faker.image.avatar(),

    interests: [faker.music.genre(), faker.music.genre()],
    favoriteLocations: [faker.location.city(), faker.location.city()],
    availibility: randomAvailability,
    provider: faker.helpers.arrayElement([
      AUTH_PROVIDERS._LOCAL,
      AUTH_PROVIDERS._GOOGLE,
      AUTH_PROVIDERS._FACEBOOK,
      AUTH_PROVIDERS._X,
    ]),

    friends: [],
    blocked: [],

    karmaScore: 100,
    qualityBadge: "bronze",
    eventsAttended: 0,
    eventsHosted: 0,
    lastMinuteCancels: 0,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("users").insertOne(user);

  return NextResponse.json({
    message: "✅ user successfully created",
    insertedId: result.insertedId,
    user,
  });
}
