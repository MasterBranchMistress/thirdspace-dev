"use client";

import { useState } from "react";
import {
  sparkEvent,
  unsparkEvent,
} from "@/utils/feed-item-actions/event-item-actions/sparkHandler";
import { SessionUser } from "@/types/user-session";

type UseEventSparkArgs = {
  user?: SessionUser;
  initialHasSparked?: boolean;
  notify?: (title: string, message?: string) => void;
};

export function useEventSpark({
  user,
  initialHasSparked = false,
  notify,
}: UseEventSparkArgs) {
  const [hasSparked, setHasSparked] = useState(initialHasSparked);
  const [showPulse, setShowPulse] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleEventSpark = async (
    eventId?: string,
    meta?: { hostName?: string; title?: string },
  ) => {
    if (!eventId || !user || loading) return;

    const next = !hasSparked;
    const prev = hasSparked;

    try {
      setLoading(true);
      setHasSparked(next); // optimistic

      if (next) {
        await sparkEvent({ loggedInUser: user, eventId });
        setShowPulse(true);
        window.setTimeout(() => setShowPulse(false), 2000);

        notify?.(
          `You sparked ${meta?.hostName ?? "this"} event 🔥`,
          meta?.title ? `${meta.title} 🗓️` : "",
        );
      } else {
        await unsparkEvent({ loggedInUser: user, eventId });
        notify?.(`Removed spark 🙅`, meta?.title ? `${meta.title} 🗓️` : "");
      }
    } catch (err) {
      setHasSparked(prev); // rollback to previous state (better than false)
      console.error(err);
      notify?.("Something went wrong", "");
    } finally {
      setLoading(false);
    }
  };

  return {
    hasSparked,
    setHasSparked, // useful when you hydrate initial state later
    showPulse,
    loading,
    toggleEventSpark,
  };
}
