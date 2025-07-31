function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const videoMap = {
  morning: "/videos/friends-having-breakfast.mp4",
  afternoon: "/videos/girls_in_meadow.mp4",
  evening: "/videos/friends-enjoying-evening.mp4",
  night: "/videos/friends-at-night.mp4",
};

export const videoSrc = videoMap[getTimeOfDay()];
