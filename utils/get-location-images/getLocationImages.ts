// lib/unsplash.ts
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_API_KEY!;

export async function getLocationImage(location: string) {
  const params = new URLSearchParams({
    query: location,
    content_filter: "high",
    orientation: "landscape",
    per_page: "1",
  });

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
    cache: "force-cache", // optional: let Next.js cache this
  });

  if (!res.ok) {
    console.error("Unsplash error", await res.text());
    return null;
  }

  const data = await res.json();
  return data.results?.[0]?.urls?.regular ?? null;
}
