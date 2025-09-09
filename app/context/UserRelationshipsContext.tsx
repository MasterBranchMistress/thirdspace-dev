"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type RelationshipStatus =
  | "friend"
  | "blocked"
  | "pending_friend_request_incoming"
  | "pending_friend_request_outgoing"
  | "following"
  | "none";

type Relationships = {
  [userId: string]: RelationshipStatus;
};

type UserRelationshipsContextType = {
  relationships: Relationships;
  refreshRelationships: () => Promise<void>;
  getRelationship: (userId: string) => RelationshipStatus;
  setRelationship: (userId: string, status: RelationshipStatus) => void;
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

      //       pendingFriendRequestsIncoming?: ObjectId[];
      // pendingFriendRequestsOutgoing?: ObjectId[];

      // normalize
      (user.friends ?? []).forEach((fid: string) => (map[fid] = "friend"));
      (user.blocked ?? []).forEach((bid: string) => (map[bid] = "blocked"));
      (user.pendingFriendRequestsIncoming ?? []).forEach((rid: string) => {
        map[String(rid)] = "pending_friend_request_incoming";
      });
      (user.pendingFriendRequestsOutgoing ?? []).forEach((rid: string) => {
        map[String(rid)] = "pending_friend_request_outgoing";
      });
      (user.following ?? []).forEach((fid: string) => {
        if (!map[fid]) map[fid] = "following";
      });
      setRelationships(map);
      console.log(relationships);
    } catch (err) {
      console.error(err);
    }
  };

  const isSelf = (targetId: string) => {
    return targetId === userId;
  };

  const getRelationship = (targetId: string): RelationshipStatus => {
    return relationships[targetId] ?? "none";
  };

  const setRelationship = (targetId: string, status: RelationshipStatus) => {
    setRelationships((prev) => ({ ...prev, [targetId]: status }));
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
