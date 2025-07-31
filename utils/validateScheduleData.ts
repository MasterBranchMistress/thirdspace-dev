interface TimeRange {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

interface DayAvailability {
  day: string;
  times: TimeRange[];
}

export function validateAvailability(avail: DayAvailability[]): {
  valid: boolean;
  error?: string;
} {
  for (const dayBlock of avail) {
    const { day, times } = dayBlock;

    // Sort times by start to check overlaps easily
    const sorted = [...times].sort((a, b) => a.start.localeCompare(b.start));

    for (let i = 0; i < sorted.length; i++) {
      const { start, end } = sorted[i];

      // Parse HH:mm into minutes
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      // 1. Start must be before end
      if (startMinutes >= endMinutes) {
        return {
          valid: false,
          error: `${day}: start time must be before end time`,
        };
      }

      // 2. Duration must be at least 10 minutes
      if (endMinutes - startMinutes < 10) {
        return {
          valid: false,
          error: `${day}: time block must be at least 10 minutes`,
        };
      }

      // 3. Check overlap with next range
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const [nextH, nextM] = next.start.split(":").map(Number);
        const nextStartMinutes = nextH * 60 + nextM;
        if (nextStartMinutes < endMinutes) {
          return { valid: false, error: `${day}: overlapping time blocks` };
        }
      }
    }
  }

  return { valid: true };
}
