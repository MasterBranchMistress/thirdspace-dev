"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, Button, Card, Chip, Spinner } from "@heroui/react";
import { FeedBackground } from "@/components/background-animations/UserFeedBackground";
import Lottie from "lottie-react";
import userNotFound from "@/public/lottie/user-not-found.json";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Attachment } from "@/types/user-feed";
import { EventDoc } from "@/lib/models/Event";
import { UserDoc } from "@/lib/models/User";
import ProfileHeading from "@/components/profile-heading/profileHeading";
import ideas from "@/public/lottie/ideas.json";
import EventGridCard from "@/components/event-item-card/eventItemCard";
import endEvents from "@/public/lottie/end-events.json";

type Profile = {
  user: UserDoc;
};

type HostedEvents = {
  events: EventDoc[];
  eventType: "hosted";
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

type JoinedEvents = {
  events: EventDoc[];
  eventType: "joined";
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<HostedEvents | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<JoinedEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const viewerId = session?.user?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // ✅ start loading

      try {
        // fetch profile + events in parallel
        const [profileRes, eventsRes, attendingRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(
            `/api/users/${id}/get-hosted-events?viewerId=${viewerId}&page=1&limit=5`
          ),
          fetch(`/api/users/${id}/attending-events`),
        ]);

        // profile
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        // Hosted Events
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setHostedEvents(eventsData);
        } else {
          setHostedEvents(null);
        }

        //Joined Events
        if (attendingRes.ok) {
          const joinedEventsData = await attendingRes.json();
          setJoinedEvents(joinedEventsData);
        } else {
          setJoinedEvents(null);
        }
      } catch (err) {
        console.error("Failed to load profile/events", err);
        setProfile(null);
        setHostedEvents(null);
        setJoinedEvents(null);
      } finally {
        setLoading(false);
      }
    };

    if (id && viewerId) {
      fetchData();
    }
  }, [id, viewerId]);

  const isSelf = id?.toString() === viewerId?.toString();

  const hosted = (hostedEvents?.events ?? []).map((e) => ({
    ...e,
    eventType: "hosted" as const,
  }));
  const joined = (joinedEvents?.events ?? []).map((e) => ({
    ...e,
    eventType: "joined" as const,
  }));

  const totalEvents = [...hosted, ...joined];

  console.log("Events: ", totalEvents);
  if (loading) {
    return (
      <>
        <div className="fixed inset-0 -z-10">
          <FeedBackground />
        </div>
        <div className="flex justify-center items-center h-screen">
          <Spinner color="primary" variant="wave" />
        </div>
      </>
    );
  }
  if (!profile && !loading) {
    return (
      <>
        <div className="fixed inset-0 -z-10">
          <FeedBackground />
        </div>
        <div className="flex flex-col justify-center items-center h-[80%] mr-6">
          <Lottie
            animationData={userNotFound}
            style={{ width: 300, height: 300 }}
          />
          <p className="text-primary text-sm ml-8 text-center font-light">
            Hmm.. No sign of life here. Try again? 🤔
          </p>
          <Button
            onPress={() => router.push("/dashboard")}
            variant="shadow"
            color="primary"
            className="mt-4 ml-6"
            size="sm"
          >
            Go Back
          </Button>
        </div>
      </>
    );
  }

  // ✅ valid profile
  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <FeedBackground />
      </div>

      {/* Foreground */}
      {profile && !loading && (
        <div className="mt-[-5%] pt-0 w-full bg-black/5 shadow-xl backdrop-blur-sm rounded-none overflow-hidden">
          <div className="flex w-full flex-col items-center">
            <ProfileHeading user={profile.user} />
          </div>
        </div>
      )}

      {/* Hosted Events */}
      {totalEvents.length ? (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0">
            {totalEvents.map((event) => (
              <EventGridCard
                onClick={() =>
                  router.push(`/dashboard/event/${event._id?.toString()}`)
                }
                key={event._id?.toString()}
                event={event}
              />
            ))}
          </div>
          <div className="flex flex-col justify-center items-center py-4">
            <Lottie animationData={endEvents} style={{ width: "10rem" }} />
            <h1 className="text-primary font-light">
              Looks like that's all for now!
            </h1>
            <div className="flex flex-row gap-2">
              <Button
                onPress={() => router.push("/dashboard")}
                variant="shadow"
                color="primary"
                className="mt-4"
                size="sm"
              >
                Create Event
              </Button>
              <Button
                onPress={() => router.push("/dashboard")}
                variant="bordered"
                color="primary"
                className="mt-4"
                size="sm"
              >
                Go Back
              </Button>
            </div>
          </div>
        </section>
      ) : !isSelf ? (
        <div className="flex flex-col items-center justify-center text-center h-auto my-auto p-10">
          <Lottie animationData={ideas} style={{ width: 200 }} />
          <p className="mt-4 text-primary text-sm font-light max-w-md">
            Hmmm, it looks like{" "}
            <span className="font-medium">{profile?.user.firstName}</span>{" "}
            hasn’t attended any events yet. Maybe they need some ideas? ✨
          </p>
          <Button
            onPress={() => router.push("/dashboard")}
            variant="shadow"
            color="primary"
            className="mt-4"
            size="sm"
          >
            Go Back
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-auto my-auto p-10">
          <Lottie animationData={ideas} style={{ width: 200 }} />
          <p className="mt-4 text-primary text-sm font-light max-w-md">
            You haven’t created or joined any events yet. Get started below!
          </p>
          <div className="flex flex-row gap-2 mt-4">
            <Button
              onPress={() => router.push("/dashboard")}
              variant="shadow"
              color="primary"
              size="sm"
            >
              Create Event
            </Button>
            <Button
              onPress={() => router.push("/dashboard")}
              variant="bordered"
              color="primary"
              size="sm"
            >
              Explore Events
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
