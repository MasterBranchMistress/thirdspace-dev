// app/api/extract-tags-from-bio/route.ts
import { extractInterestTagsFromBio } from "@/utils/tag-extractor/tagExtractor";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bio } = body;

    if (!bio || typeof bio !== "string" || bio.trim().length < 10) {
      return NextResponse.json(
        { error: "Bio must be a string with at least 10 characters." },
        { status: 400 }
      );
    }

    const tags = await extractInterestTagsFromBio(bio);
    return NextResponse.json({ tags });
  } catch (err: any) {
    console.error("Tag extraction failed:", err.message);
    return NextResponse.json(
      { error: "Failed to extract tags" },
      { status: 500 }
    );
  }
}
