// utils/getTimeOfDay.ts
export function getVideoSrcForTimeOfDay(): string {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return "/videos/friends-having-breakfast.mp4";
  if (hour >= 12 && hour < 17) return "/videos/girls_in_meadow.mp4";
  if (hour >= 17 && hour < 21) return "/videos/friends-enjoying-evening.mp4";
  return "/videos/friends-at-night.mp4";
}
