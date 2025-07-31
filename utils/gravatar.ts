import md5 from "md5";

/**
 * Generates a Gravatar URL for the given email.
 * Falls back to identicon if the user has no Gravatar.
 */
export function getGravatarUrl(email: string): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}
