"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { useFeed } from "@/app/context/UserFeedContext";
import Lottie from "lottie-react";
import { FeedBackground } from "@/components/background-animations/UserFeedBackground";
import LoadingPage from "@/components/spinner/LoadingPage";
import FeedItemCard from "@/components/feed-item-card/FeedItemCard";
import GreetingHeader from "@/components/feed-item-card/GreetingHeader";
import EmptyFeedState from "@/components/empty-feed-state/EmptyFeedState";
import animationData from "@/public/lottie/end-of-feed.json";
import { useSmartFeedRefresh } from "@/utils/smart-refresh/useSmartRefresh";
import { FeedItem } from "@/types/user-feed";
import spaceman from "@/public/lottie/space-man.json";
import backToTop from "@/public/lottie/back-to-top.json";
import { useBrowserLocation } from "@/utils/geolocation/get-user-location/getUserLocation";
import { useUserInfo } from "@/app/context/UserContext";
import { getStatusSparks } from "@/utils/feed-item-actions/status-item-actions/sparkHandler";
import { UserDoc } from "@/lib/models/User";
import { getEventSparks } from "@/utils/feed-item-actions/event-item-actions/sparkHandler";
import { getFriendSparkPreviews } from "@/utils/metadata/friend-spark-previews/friendSparkPreviews";
import { getBoostPreviews } from "@/utils/metadata/boost-promotion-preview/boostPreview";
import { getUser } from "@/utils/frontend-backend-connection/getUserInfo";
import { Button } from "@heroui/button";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { getBoostedPromos } from "@/utils/feed-item-actions/status-item-actions/boostHandler";
import { Console } from "console";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { status: locStatus, coords } = useBrowserLocation();
  const { avatar, username, setAvatar, rank, karmaScore } = useUserInfo();

  const { items, loading, error, hasMore, loadMore, prependItems } = useFeed();

  const { newItems, hasNewItems, applyNewItems } = useSmartFeedRefresh({
    userId: session?.user.id!,
    feedItems: items,
    setFeedItems: prependItems as (items: FeedItem[]) => void,
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const hydratedRef = useRef(false);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore],
  );

  const [userInfo, setUserInfo] = useState<UserDoc | null>(null);
  const [showMediaTutorial, setShowMediaTutorial] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      locStatus === "success" &&
      session?.user?.id &&
      coords.lat &&
      coords.lng
    ) {
      // Don't overwrite if profile already has a location name
      if (session.user.location?.name) return;

      fetch(`/api/users/${session.user.id}/save-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: {
            name: session.user.location?.name || "", // preserve if available
            lat: coords.lat,
            lng: coords.lng,
          },
        }),
      }).catch((err) => console.error("Failed to update location:", err));
    }
  }, [
    status,
    locStatus,
    coords,
    session?.user?.id,
    session?.user?.location?.name,
  ]);

  useEffect(() => {
    if (session?.user?.avatar) {
      setAvatar(session.user.avatar);
    }
  }, [session?.user?.avatar, setAvatar]);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (!items?.length) return;
    if (hydratedRef.current) return;

    const run = async () => {
      // ---- Status IDs ----
      const statusIds = items
        .map((it: any) => it?.target?.status?.sourceId)
        .filter((id: any): id is string => Boolean(id));

      // ---- Event IDs (stringify ObjectIds) ----
      const eventIds = items
        .map((it: any) => it?.target?.eventId ?? it?.actor?.eventId)
        .filter(Boolean)
        .map((id: any) => String(id));

      const friendswhoSparked = await getFriendSparkPreviews(
        session.user,
        statusIds,
        eventIds,
      );

      const usersWhoBoosted = await getBoostPreviews(session.user, statusIds);

      const statusSparkedIds = statusIds.length
        ? await getStatusSparks(statusIds, session.user)
        : [];

      const eventSparkedIds = eventIds.length
        ? await getEventSparks(eventIds, session.user)
        : [];

      const boostedPromoIds = statusIds.length
        ? await getBoostedPromos(statusIds, session.user)
        : [];

      const statusSet = new Set(statusSparkedIds.map(String));
      const eventSet = new Set(eventSparkedIds.map(String));
      const boostSet = new Set(boostedPromoIds.map(String));

      const hydratedItems: FeedItem[] = items.map((it: any) => {
        const sid = it?.target?.status?.sourceId;

        if (sid) {
          const statusId = String(sid);
          const boostKey = statusId;

          return {
            ...it,
            hasSparked: statusSet.has(statusId),
            hasBoosted: boostSet.has(boostKey),
            friendSparkPreviewUsers:
              friendswhoSparked?.status?.[statusId] ?? [],
            boostPreviewUsers: usersWhoBoosted?.promotion?.[boostKey] ?? [],
          };
        }

        const eid = it?.actor?.eventId;

        if (eid)
          return {
            ...it,
            hasSparked: eventSet.has(String(eid)),
            friendSparkPreviewUsers:
              friendswhoSparked.event?.[String(eid)] ?? [],
          };

        return { ...it, hasSparked: false, hasBoosted: false };
      });

      prependItems?.(hydratedItems);
      hydratedRef.current = true;
    };

    run().catch(console.error);
  }, [items.length, session?.user?.id]);

  useEffect(() => {
    const loadUser = async () => {
      if (!session?.user) return;
      const user = await getUser(session?.user);
      setUserInfo(user);
    };
    loadUser();
  }, [session?.user]);

  useEffect(() => {
    const seen = localStorage.getItem("tutorial_media_post_seen") === "true";
    setShowMediaTutorial(!seen);
  }, []);

  if (status === "loading" || !coords) return <LoadingPage />;
  if (error) return <p>{error}</p>;
  if ((!items || items.length === 0) && !loading)
    return <EmptyFeedState name={session?.user.firstName} />;

  const dismissMediaTutorial = () => {
    localStorage.setItem("tutorial_media_post_seen", "true");
    setShowMediaTutorial(false);
  };

  return (
    <div>
      <FeedBackground />
      <div className="flex flex-col">
        <GreetingHeader />
        {newItems.length > 0 && (
          <div
            className="animate-appearance-in fixed bottom-0 z-40 w-full bg-concrete text-primary text-md flex items-center justify-center"
            onClick={applyNewItems}
          >
            <div className="flex items-center gap-3">
              <Lottie
                animationData={spaceman}
                loop
                autoplay
                style={{
                  height: "70px",
                  width: "70px",
                  zIndex: 100,
                }}
              />
              <span className="font-light tracking-tight">
                <span className="mr-2">{newItems.length}</span>New Update
                {newItems.length === 1 ? "" : "s"} Available!
              </span>
              <button
                color="primary"
                className="bg-none text-sm underline-offset-2 hover:text-white transition"
              >
                <Lottie
                  animationData={backToTop}
                  loop
                  autoplay
                  style={{
                    height: "30px",
                    width: "30px",
                    zIndex: 100,
                    marginLeft: "5px",
                  }}
                />
              </button>
            </div>
          </div>
        )}

        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const showTutorialOnThisCard = showMediaTutorial && i === 0;

          return (
            <div key={i} ref={isLast ? lastItemRef : null}>
              <FeedItemCard
                item={item}
                showMediaTutorial={showTutorialOnThisCard}
                dismissMediaTutorial={dismissMediaTutorial}
              />
            </div>
          );
        })}
        {loading && <LoadingPage />}
        {!hasMore && !loading && (
          <div
            className="flex flex-col items-center justify-center gap-2 animate-appearance-in"
            style={{ marginBottom: "2rem" }}
          >
            <p className="text-primary text-center text-lg font-extralight tracking-tight mb-4">
              You're all caught up, {session?.user.firstName} ✨
            </p>
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{
                height: "200px",
                width: "200px",
                marginBottom: "-1rem",
                marginTop: "-2rem",
              }}
            />
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Button
                size="sm"
                className="
  text-xs
  px-5 py-2
  rounded-md
  font-light
  text-white
  bg-gradient-to-r
  from-indigo-500
  via-fuchsia-500
  to-cyan-400
  shadow-lg
  transition-all
  duration-300
  hover:scale-105
  hover:shadow-[0_0_16px_rgba(168,85,247,0.7)]
  active:scale-95
"
                startContent={<RocketLaunchIcon width={20} color="secondary" />}
              >
                Hyperdrive™{" "}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
