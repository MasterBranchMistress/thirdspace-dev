// app/context/NotificationsContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { ObjectId } from "mongodb";

export type Notification = {
  _id: ObjectId;
  id: string;
  actorId: string;
  message: string;
  type: string;
  timestamp?: string;
  avatar?: string;
  eventId?: string;
};

type Ctx = {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  accept: (senderId: string) => Promise<void>;
  reject: (senderId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearNotification: (notifId: string) => Promise<void>;
  notificationCount: number;
};

const NotificationsContext = createContext<Ctx | null>(null);

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON<{ notifications: Notification[] }>(
        `/api/users/${userId}/get-notifications`
      );
      setNotifications(data.notifications ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removeBySender = useCallback((senderId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => String(n.actorId) !== String(senderId))
    );
  }, []);

  const accept = useCallback(
    async (senderId: string) => {
      if (!userId) return;
      const prev = notifications;
      removeBySender(senderId);
      try {
        await fetchJSON(`/api/users/${userId}/friend-request/accept`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromId: senderId }),
        });
        await refresh();
      } catch (e) {
        setNotifications(prev);
        throw e;
      }
    },
    [userId, notifications, removeBySender]
  );

  const reject = useCallback(
    async (senderId: string) => {
      if (!userId) return;
      const snapshot = notifications;
      removeBySender(senderId);
      try {
        await fetchJSON(`/api/users/${userId}/friend-request/reject`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromId: senderId }),
        });
        await refresh();
      } catch (e) {
        setNotifications(snapshot);
        throw e;
      }
    },
    [userId, notifications, removeBySender]
  );
  useEffect(() => {
    setNotifications([]);
    setError(null);
    if (userId) refresh();
  }, [userId, refresh]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      refresh();
    }, 60_000);

    return () => clearInterval(interval);
  }, [userId, refresh]);

  const clearAll = async () => {
    if (!userId) return;
    const prev = notifications;
    setNotifications([]);
    try {
      await fetchJSON(`/api/users/${userId}/read-notification/clear-all`, {
        method: "DELETE",
      });
    } catch (e) {
      setNotifications(prev);
      throw e;
    }
  };

  const clearNotification = async (notifId: string) => {
    if (!userId) return;
    const prev = notifications;
    setNotifications((curr) =>
      curr.filter((n) => n._id.toString() !== notifId)
    );
    try {
      await fetchJSON(`/api/users/${userId}/delete-notification`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: userId,
          notifId: notifId,
        }),
      });
    } catch (e) {
      setNotifications(prev);
      throw e;
    }
  };

  const value = useMemo<Ctx>(
    () => ({
      notifications,
      loading,
      error,
      refresh,
      accept,
      reject,
      clearNotification,
      clearAll,
      notificationCount: notifications.length,
    }),
    [
      notifications,
      loading,
      error,
      refresh,
      accept,
      reject,
      clearAll,
      clearNotification,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  return ctx;
}
