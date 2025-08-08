export default function detectMediaType(
  url: string
): "image" | "video" | undefined {
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  if (lower.match(/\.(mp4|mov|avi|webm|mkv)$/)) return "video";
  return undefined;
}
