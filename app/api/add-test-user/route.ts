import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { AUTH_PROVIDERS, DBS } from "@/lib/constants";
import { ObjectId } from "mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DBS._THIRDSPACE);

  // Generate random availability
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

  // Generate fake coordinates for location
  const fakeLat = parseFloat(faker.location.latitude().toFixed());
  const fakeLng = parseFloat(faker.location.longitude().toFixed());

  // Shared timestamps
  const now = new Date();

  // Build fake user doc matching UserDoc type
  const user = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName(),
    usernameLastChangedAt: now,
    email: faker.internet.email(),
    passwordHash: faker.internet.password({ memorable: false }),
    avatar: faker.image.avatar(),
    interests: [faker.music.genre(), faker.music.genre()],
    bio: faker.lorem.sentence(),
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
    pendingFriendRequests: [],
    createdAt: now,
    updatedAt: now,
    bioLastUpdatedAt: now,
    avatarLastUpdatedAt: now,
    locationLastUpdatedAt: now,
    statusLastUpdatedAt: now,
    tagsLastupdatedAt: now,
    joinedEventDate: faker.date.past(),
    acceptedFriendDate: faker.date.past(),
    addedEventDate: faker.date.past(),
    notifications: [],
    isAdmin: false,
    karmaScore: faker.number.int({ min: 0, max: 500 }),
    qualityBadge: faker.helpers.arrayElement([
      "bronze",
      "silver",
      "gold",
      "platinum",
    ]),
    eventsAttended: faker.number.int({ min: 0, max: 50 }),
    eventsHosted: faker.number.int({ min: 0, max: 20 }),
    lastMinuteCancels: faker.number.int({ min: 0, max: 5 }),
    tags: [faker.word.noun(), faker.word.noun()],
    location: {
      name: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
      lat: fakeLat,
      lng: fakeLng,
    },
    lang: faker.helpers.arrayElement(["en", "es", "fr", "de"]),
    status: faker.helpers.arrayElement([
      "Available",
      "Busy",
      "Looking to hang",
      "Traveling",
    ]),
    followers: [],
    following: [],
  };

  const result = await db.collection("users").insertOne(user);

  return NextResponse.json({
    message: "✅ Test user successfully created",
    insertedId: result.insertedId,
    user,
  });
}
