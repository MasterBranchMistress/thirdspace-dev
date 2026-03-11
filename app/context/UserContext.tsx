"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";
import { UserRanking } from "@/lib/constants";

type UserInfoState = {
  avatar?: string;
  username?: string;
  rank?: UserRanking;
  karmaScore?: number;
};

type UserInfoContextType = UserInfoState & {
  setAvatar: (avatar: string) => void;
  setUsername: (username: string) => void;
  setRank: (rank: UserRanking) => void;
  setKarmaScore: (score: number) => void;
  setUserInfo: (updates: Partial<UserInfoState>) => void;
};

const UserInfoContext = createContext<UserInfoContextType | undefined>(
  undefined,
);

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();

  const [userInfo, setUserInfoState] = useState<UserInfoState>({
    avatar: undefined,
    username: undefined,
    rank: undefined,
    karmaScore: undefined,
  });

  useEffect(() => {
    const nextAvatar = session?.user?.avatar;
    const nextUsername = session?.user?.username;
    const nextRank = session?.user?.qualityBadge;
    const nextKarmaScore = session?.user?.karmaScore;

    setUserInfoState((prev) => {
      if (
        prev.avatar === nextAvatar &&
        prev.username === nextUsername &&
        prev.rank === nextRank &&
        prev.karmaScore === nextKarmaScore
      ) {
        return prev;
      }

      return {
        avatar: nextAvatar,
        username: nextUsername,
        rank: nextRank,
        karmaScore: nextKarmaScore,
      };
    });
  }, [
    session?.user?.avatar,
    session?.user?.username,
    session?.user?.qualityBadge,
    session?.user?.karmaScore,
  ]);

  const setAvatar = useCallback((avatar: string) => {
    setUserInfoState((prev) => ({ ...prev, avatar }));
  }, []);

  const setUsername = useCallback((username: string) => {
    setUserInfoState((prev) => ({ ...prev, username }));
  }, []);

  const setRank = useCallback((rank: UserRanking) => {
    setUserInfoState((prev) => ({ ...prev, rank }));
  }, []);

  const setKarmaScore = useCallback((score: number) => {
    setUserInfoState((prev) => ({ ...prev, karmaScore: score }));
  }, []);

  const setUserInfo = useCallback((updates: Partial<UserInfoState>) => {
    setUserInfoState((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(
    () => ({
      ...userInfo,
      setAvatar,
      setUsername,
      setRank,
      setKarmaScore,
      setUserInfo,
    }),
    [userInfo, setAvatar, setUsername, setRank, setKarmaScore, setUserInfo],
  );

  return (
    <UserInfoContext.Provider value={value}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = () => {
  const ctx = useContext(UserInfoContext);
  if (!ctx) {
    throw new Error("useUserInfo must be used within UserInfoProvider");
  }
  return ctx;
};
