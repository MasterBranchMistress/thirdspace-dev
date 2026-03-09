"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import { UserRanking } from "@/lib/constants";

type AvatarContextType = {
  avatar: string | undefined;
  setAvatar: (url: string) => void;
};

type UsernameContextType = {
  username: string | undefined;
  setUsername: (input: string) => void;
};

type RankContextType = {
  rank: UserRanking | undefined;
  setRank: (input: UserRanking) => void;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);
const UsernameContext = createContext<UsernameContextType | undefined>(
  undefined,
);
const RankContext = createContext<RankContextType | undefined>(undefined);

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [rank, setRank] = useState<UserRanking | undefined>(undefined);

  useEffect(() => {
    if (session?.user?.avatar) {
      setAvatar(session.user.avatar);
    }

    if (session?.user?.username) {
      setUsername(session.user.username);
    }
    if (session?.user?.qualityBadge) {
      setRank(session.user.qualityBadge);
    }
  }, [
    session?.user?.avatar,
    session?.user?.username,
    session?.user?.qualityBadge,
  ]);

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      <UsernameContext.Provider value={{ username, setUsername }}>
        <RankContext.Provider value={{ rank, setRank }}>
          {children}
        </RankContext.Provider>
      </UsernameContext.Provider>
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within UserInfoProvider");
  return ctx;
};

export const useUsername = () => {
  const ctx = useContext(UsernameContext);
  if (!ctx) throw new Error("useUsername must be used within UserInfoProvider");
  return ctx;
};

export const useRank = () => {
  const ctx = useContext(RankContext);
  if (!ctx) throw new Error("useRank must be used within UserInfoProvider");
  return ctx;
};
