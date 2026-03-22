import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { faker } from "@faker-js/faker";
import { AUTH_PROVIDERS, COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import {
  sanitizeDisplayTags,
  buildNormalizedTags,
  buildTagMatchKeysFromNormalized,
} from "@/utils/metadata/tag-handling/normalizeTags";

const TEST_TAG_GROUPS = [
  ["Anime", "Pokémon", "Smash"],
  ["Pokemon", "Super Smash Bros", "Co-Op Gaming"],
  ["Dungeons & Dragons", "Tabletop RPGs", "Fantasy"],
  ["dnd", "TTRPG", "Board Games"],
  ["EDM", "House Music", "Raves"],
  ["Weightlifting", "Fitness", "Gym"],
  ["Lifting", "Basketball", "Running"],
  ["Coding", "Art", "Movies"],
  ["Co-Op Gaming", "FPS", "Call of Duty"],
  ["co op gaming", "fps", "call of duty"],
  ["Anime", "Art", "Cosplay"],
  ["House Music", "EDM", "Dancing"],
  ["Tabletop RPGs", "Fantasy", "Writing"],
  ["Basketball", "Fitness", "Sports"],
  ["Movies", "Gaming", "Music"],
];

function buildRandomAvailability() {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return Array.from({
    length: faker.number.int({ min: 1, max: 3 }),
  }).map(() => {
    const day = faker.helpers.arrayElement(daysOfWeek);
    const start = faker.helpers.arrayElement(["09:00", "13:00", "18:00"]);
    const end = faker.helpers.arrayElement(["11:00", "15:00", "20:00"]);

    return {
      day,
      times: [{ start, end }],
    };
  });
}

function buildSeedLocation() {
  const baseLat = 26.0997;
  const baseLng = -98.5786;

  const lat = Number(
    (
      baseLat + faker.number.float({ min: -0.08, max: 0.08, fractionDigits: 6 })
    ).toFixed(6),
  );

  const lng = Number(
    (
      baseLng + faker.number.float({ min: -0.08, max: 0.08, fractionDigits: 6 })
    ).toFixed(6),
  );

  return {
    name: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    lat,
    lng,
    geo: {
      type: "Point" as const,
      coordinates: [lng, lat] as [number, number],
    },
  };
}

function buildSeedUser(index: number): UserDoc {
  const now = new Date();
  const rawTags = faker.helpers.arrayElement(TEST_TAG_GROUPS);

  const tags = sanitizeDisplayTags(rawTags);
  const normalizedTags = buildNormalizedTags(tags);
  const tagMatchKeys = buildTagMatchKeysFromNormalized(normalizedTags);

  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: `test_${faker.internet.username().toLowerCase()}_${Date.now()}_${index}`,
    usernameLastChangedAt: now,
    email: `test_${Date.now()}_${index}_${faker.internet.email().toLowerCase()}`,
    passwordHash: "dev-seeded-user-no-login",
    avatar: faker.image.avatar(),
    bio: `Seeded test user for tag matching (${tags.join(", ")})`,
    favoriteLocations: [faker.location.city(), faker.location.city()],
    availibility: buildRandomAvailability(),
    provider: faker.helpers.arrayElement([
      AUTH_PROVIDERS._LOCAL,
      AUTH_PROVIDERS._GOOGLE,
      AUTH_PROVIDERS._FACEBOOK,
      AUTH_PROVIDERS._X,
    ]),
    friends: [],
    blocked: [],
    pendingFriendRequestsIncoming: [],
    pendingFriendRequestsOutgoing: [],
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
      "drifter",
      "explorer",
      "navigator",
      "connector",
      "pioneer",
      "luminary",
    ]),
    eventsAttended: faker.number.int({ min: 0, max: 50 }),
    eventsHosted: faker.number.int({ min: 0, max: 20 }),
    lastMinuteCancels: faker.number.int({ min: 0, max: 5 }),
    tags,
    normalizedTags,
    tagMatchKeys,
    location: buildSeedLocation(),
    shareLocation: true,
    shareJoinedEvents: true,
    shareHostedEvents: true,
    visibility: "public",
    lang: faker.helpers.arrayElement(["en", "es", "fr", "de"]),
    status: faker.helpers.arrayElement([
      "Available",
      "Busy",
      "Looking to hang",
      "Traveling",
    ]),
    followers: [],
    following: [],
    onboarded: true,
    onboarding: {
      exploredSolarSystem: true,
      exploredSpaceStation: true,
      reviewedPrivacy: true,
      addedInterests: true,
      completed: true,
    },
    oldRank: "drifter",
    newRank: null,
  };
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const usersCollection = db.collection<UserDoc>(COLLECTIONS._USERS);

    const usersToInsert = Array.from({ length: 10 }, (_, index) =>
      buildSeedUser(index),
    );

    const result = await usersCollection.insertMany(usersToInsert);

    return NextResponse.json({
      message: "✅ 10 test users successfully created",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
      users: usersToInsert.map((user) => ({
        username: user.username,
        tags: user.tags,
        normalizedTags: user.normalizedTags,
        tagMatchKeys: user.tagMatchKeys,
        location: user.location,
      })),
    });
  } catch (error) {
    console.error("Error seeding test users:", error);

    return NextResponse.json(
      { error: "Failed to seed test users." },
      { status: 500 },
    );
  }
}
