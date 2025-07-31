import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("thirdspace");

    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      status: "✅ Connected successfully!",
      collections: collections.map((c) => c.name),
    });
  } catch (error: unknown) {
    console.error("❌ MongoDB connection error:", error);
    const message = "Unknown error";
    return NextResponse.json(
      {
        status: "❌ Connection failed",
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
