"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type RelationshipFlags = {
  friend?: boolean;
  blocked?: boolean;
  pendingIncoming?: boolean;
  pendingOutgoing?: boolean;
  following?: boolean;
};

type Relationships = {
  [userId: string]: RelationshipFlags;
};

type UserRelationshipsContextType = {
  relationships: Relationships;
  refreshRelationships: () => Promise<void>;
  getRelationship: (userId: string) => RelationshipFlags;
  setRelationship: (userId: string, status: RelationshipFlags) => void;
  isSelf: (userId: string) => boolean;
};

const UserRelationshipsContext =
  createContext<UserRelationshipsContextType | null>(null);

export function UserRelationshipsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [relationships, setRelationships] = useState<Relationships>({});

  useEffect(() => {
    if (!userId) return;
    refreshRelationships();
  }, [userId]);

  const refreshRelationships = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load relationships");
      const data = await res.json();
      const user = data.user;

      const map: Relationships = {};

      (user.friends ?? []).forEach((fid: string) => {
        map[fid] = { ...(map[fid] ?? {}), friend: true };
      });
      (user.blocked ?? []).forEach((bid: string) => {
        map[bid] = { ...(map[bid] ?? {}), blocked: true };
      });
      (user.pendingFriendRequestsIncoming ?? []).forEach((rid: string) => {
        map[rid] = { ...(map[rid] ?? {}), pendingIncoming: true };
      });
      (user.pendingFriendRequestsOutgoing ?? []).forEach((rid: string) => {
        map[rid] = { ...(map[rid] ?? {}), pendingOutgoing: true };
      });
      (user.following ?? []).forEach((fid: string) => {
        map[fid] = { ...(map[fid] ?? {}), following: true };
      });

      setRelationships(map);
    } catch (err) {
      console.error(err);
    }
  };

  const isSelf = (targetId: string) => targetId === userId;

  const getRelationship = (targetId: string): RelationshipFlags => {
    return relationships[targetId] ?? {};
  };

  const setRelationship = (targetId: string, status: RelationshipFlags) => {
    setRelationships((prev) => ({
      ...prev,
      [targetId]: {
        ...(prev[targetId] ?? {}),
        ...status,
      },
    }));
  };

  return (
    <UserRelationshipsContext.Provider
      value={{
        relationships,
        refreshRelationships,
        getRelationship,
        setRelationship,
        isSelf,
      }}
    >
      {children}
    </UserRelationshipsContext.Provider>
  );
}

export function useUserRelationships() {
  const ctx = useContext(UserRelationshipsContext);
  if (!ctx) {
    throw new Error(
      "useUserRelationships must be used within a UserRelationshipsProvider"
    );
  }
  return ctx;
}
