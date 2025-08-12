export async function geocodeAddress(address: string) {
  if (!address || typeof address !== "string") return null;

  try {
    const accessToken = process.env.MAPBOX_TOKEN;
    if (!accessToken) throw new Error("Missing MAPBOX_TOKEN");

    // encode the address for URL
    const encoded = encodeURIComponent(address);

    // Mapbox forward geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${accessToken}&limit=1`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox error: ${res.statusText}`);

    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }

    return null;
  } catch (err) {
    console.error("Geocode error:", err);
    return null;
  }
}
