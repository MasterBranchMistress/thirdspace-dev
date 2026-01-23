import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/utils/auth";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          return null;
        }
        const client = await clientPromise;
        const db = client.db(DBS._THIRDSPACE);
        const users = db.collection<UserDoc>(COLLECTIONS._USERS);
        const user = await users.findOne({ email: credentials?.email });
        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials!.password,
          user.passwordHash,
        );
        if (!isValid) {
          return null;
        }

        console.log(`✅ Successful login for ${user.firstName}`);

        return {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          karmaScore: user.karmaScore,
          qualityBadge: user.qualityBadge,
          eventsAttended: user.eventsAttended,
          eventsHosted: user.eventsHosted,
          lastMinuteCancels: user.lastMinuteCancels,
          bio: user.bio,
          tags: user.tags,
          location: user.location,
          lang: user.lang,
          interests: user.interests,
          favoriteLocations: user.favoriteLocations,
          provider: user.provider,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        Object.assign(token, user);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, token);
      }
      return session;
    },
  },
};
