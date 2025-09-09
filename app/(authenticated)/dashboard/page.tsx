"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
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
import { useAvatar } from "@/app/context/AvatarContext";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { status: locStatus, coords } = useBrowserLocation();
  const { avatar, setAvatar } = useAvatar();

  const { items, loading, error, hasMore, loadMore, prependItems } = useFeed();

  const { newItems, applyNewItems } = useSmartFeedRefresh({
    userId: session?.user.id!,
    feedItems: items,
    setFeedItems: prependItems as (items: FeedItem[]) => void,
  });

  const observer = useRef<IntersectionObserver | null>(null);

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
    [loading, hasMore, loadMore]
  );

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
  }, [session?.user?.avatar, avatar]);

  if (status === "loading" || !coords) return <LoadingPage />;
  if (error) return <p>{error}</p>;
  if ((!items || items.length === 0) && !loading)
    return <EmptyFeedState name={session?.user.firstName} />;

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
                New Updates Available!
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
          // TODO: Replace with stable key once backend IDs are consistent

          const isLast = i === items.length - 1;
          return (
            <div key={i} ref={isLast ? lastItemRef : null}>
              <FeedItemCard item={item} />
            </div>
          );
        })}
        {loading && <LoadingPage />}
        {!hasMore && !loading && (
          <div
            className="flex flex-col items-center justify-center gap-2 animate-appearance-in mt-7"
            style={{ marginBottom: "2rem" }}
          >
            <p className="text-primary text-center text-lg font-extralight tracking-tight mb-4">
              Looks like you're all caught up, {session?.user.firstName} ✨
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
              <button className="text-xs bg-primary text-concrete font-light rounded-md shadow-md px-4 py-2">
                Explore Events
              </button>
              <button className="text-xs bg-transparent text-primary border border-primary font-light rounded-md px-4 py-2">
                Make Friends!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
