"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";

type AvatarContextType = {
  avatar: string | undefined;
  setAvatar: (url: string) => void;
};

type UsernameContextType = {
  username: string | undefined;
  setUsername: (input: string) => void;
};

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);
const UsernameContext = createContext<UsernameContextType | undefined>(
  undefined,
);

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (session?.user?.avatar) {
      setAvatar(session.user.avatar);
    }

    if (session?.user?.username) {
      setUsername(session.user.username);
    }
  }, [session?.user?.avatar, session?.user?.username]);

  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      <UsernameContext.Provider value={{ username, setUsername }}>
        {children}
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
