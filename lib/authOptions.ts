import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/utils/auth";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { UserDoc } from "@/lib/models/User";
import { SessionUser } from "@/types/user-session";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db(DBS._THIRDSPACE);
        const users = db.collection<UserDoc>(COLLECTIONS._USERS);

        const user = await users.findOne({ email: credentials.email });
        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) {
          return null;
        }

        const sessionUser: SessionUser = {
          id: user._id.toString(),
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          username: user.username ?? "",
          avatar: user.avatar,
          isAdmin: user.isAdmin ?? false,
          karmaScore: user.karmaScore ?? 0,
          qualityBadge: user.qualityBadge,
          eventsAttended: user.eventsAttended ?? 0,
          eventsHosted: user.eventsHosted ?? 0,
          lastMinuteCancels: user.lastMinuteCancels ?? 0,
          bio: user.bio ?? "",
          tags: user.tags ?? [],
          location: user.location,
          lang: user.lang ?? "en",
          interests: user.interests ?? [],
          favoriteLocations: user.favoriteLocations ?? [],
          provider: user.provider ?? "credentials",
        };

        return sessionUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        Object.assign(token, user);
      }

      if (trigger === "update" && session?.user) {
        Object.assign(token, session.user);
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
