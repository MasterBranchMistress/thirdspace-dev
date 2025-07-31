import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { ObjectId } from "mongodb";

/**
 * Hashes a plaintext password using bcrypt.
 * @param password Plain user password
 * @returns A bcrypt hash of the password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plaintext password with a hashed one.
 * @param password Plain user password
 * @param hashedPassword Bcrypt hashed password from DB
 * @returns True if they match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateAnonUsername(): string {
  const adjective = faker.word.adjective(); // e.g. 'witty'
  const animal = faker.animal.type(); // e.g. 'tiger'
  const number = faker.number.int({ min: 1, max: 999 });
  return `${capitalize(adjective)}${capitalize(animal)}${number}`;
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

//TODO: implement this when you get session tokens from nextAuth
// export async function isAuthorized(req: NextRequest, targetId: string) {
//   const session = await getServerSession(authOptions);
//   return session?.user?.id === targetId;
// }

export function isAuthorized(
  callerId: string | ObjectId,
  userId: string | ObjectId
): boolean {
  return callerId.toString() === userId.toString();
}
