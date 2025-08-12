// app/api/geocode/reverse/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return NextResponse.json(
        { error: "Valid lat and lng are required" },
        { status: 400 }
      );
    }

    const token = process.env.MAPBOX_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing MAPBOX_TOKEN" },
        { status: 500 }
      );
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      `${lng},${lat}`
    )}.json?types=place,locality,neighborhood,address&limit=1&access_token=${token}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Mapbox: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    return NextResponse.json({
      place_name: feature.place_name ?? null,
      lat,
      lng,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Reverse geocode failed" },
      { status: 500 }
    );
  }
}
