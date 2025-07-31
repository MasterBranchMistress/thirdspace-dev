import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

const handler = await NextAuth(authOptions);
export { handler as GET, handler as POST };
