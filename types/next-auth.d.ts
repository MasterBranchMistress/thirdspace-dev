import { SessionUser } from "./user-session";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  type User = SessionUser;
}

declare module "next-auth/jwt" {
  type JWT = SessionUser;
}
