const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_API_KEY;

export async function getLocationImage(location: string) {
  const params = new URLSearchParams({
    query: location,
    content_filter: "high",
    orientation: "portrait", // better for banners/cards
    per_page: "1", // just grab the first relevant one
  });

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Unsplash error: ${res.statusText}`);

  const data = await res.json();
  return data.results?.[0]?.urls?.regular || null;
}
