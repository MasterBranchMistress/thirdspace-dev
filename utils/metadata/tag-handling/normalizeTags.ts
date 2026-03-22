export function normalizeTag(tag: string): string {
  return tag
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeDisplayTags(tags: string[] = []): string[] {
  return Array.from(
    new Set(
      tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );
}

export function buildNormalizedTags(tags: string[] = []): string[] {
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
}

export function buildTagMatchKeyFromNormalized(tag: string): string {
  return tag.replace(/\s+/g, "");
}

export function buildTagMatchKeysFromNormalized(tags: string[] = []): string[] {
  return Array.from(
    new Set(
      tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
        .map(buildTagMatchKeyFromNormalized)
        .filter(Boolean),
    ),
  );
}
