"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Input,
  Spinner,
  CardFooter,
  Badge,
  Alert,
} from "@heroui/react";
import { getSession } from "next-auth/react";
import { UserDoc } from "@/lib/models/User";
import { FeedBackground } from "@/components/background-animations/UserFeedBackground";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  FireIcon,
  HandThumbUpIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import AttachmentSwiper from "@/components/swiper/swiper";
import noComments from "@/public/lottie/make-comment.json";
import send from "@/public/lottie/send.json";
import { useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { EventActions } from "@/components/event-actions/mainEventActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/providers/ToastProvider";
import { EventStatusHeader } from "@/components/event-page-components/getEventStatusHeader";
import confetti from "canvas-confetti";
import ConfirmDialog from "@/components/confirm-delete/confirmDialog";
import LoadingPage from "@/components/spinner/LoadingPage";
import notFound from "@/public/lottie/user-not-found.json";
import tip from "@/public/lottie/tip.json";
import CommentList from "@/components/comment-handling/CommentList";

type Comment = {
  userId: any;
  commenter: {
    userId: string;
    avatar: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  user: UserDoc;
  text: string;
  timestamp: Date;
  replies: Comment[];
  sparks: number;
  likes: number;
};

type EventDetails = {
  donations: any;
  event: Comment;
  _id: string;
  title: string;
  status: string;
  description: string;
  date: string;
  startTime: string;
  tags: string[];
  public: boolean;
  location: { name: string; lat?: number; lng?: number };
  comments: Comment[];
  host: {
    _id: string;
    avatar: string;
    firstName: string;
    lastName: string;
  };
  attendees: string[];
  budgetInfo: {
    estimatedCost: number;
    currency: string;
  };
};

export default function EventViewPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const router = useRouter();
  const { notify } = useToast();

  // get session client-side
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      setUserId(session?.user?.id ?? null);
    };
    fetchSession();
  }, []);

  //fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [eventRes, commentRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/users/${id}/get-comments`),
        ]);

        if (!eventRes.ok) {
          setEvent(null); // trigger 404 fallback
          setLoading(false);
          return;
        }

        const eventData = await eventRes.json();
        const commentData = await commentRes.json();

        setEvent(eventData);

        // ✅ check host
        if (userId && eventData?.host) {
          setIsHost(String(eventData.host._id) === String(userId));
        }

        // ✅ check if joined
        if (userId && Array.isArray(eventData.attendees)) {
          const joined = eventData.attendees.some(
            (attendee: any) => String(attendee._id) === String(userId)
          );
          setIsJoined(joined);
          console.log("Joined: ", joined);
        }

        setAttachments(eventData.attachments);
        setComments(commentData.comments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id && userId) fetchEvent();
  }, [id, userId]);

  console.log("Event: ", event?._id);

  // Handlers
  const handleJoin = async () => {
    if (!userId) return;
    const res = await fetch(`/api/events/${id}/join-event`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      notify(
        "Oops! Couldn't join 😭",
        errData.error || "Something went wrong. Please try again later."
      );
      return;
    }
    setIsJoined(true);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
    notify(
      "Successfully Joined Event 🎉",
      "Jump in and let the group know you've arrived!"
    );
  };

  const handleLeave = async () => {
    if (!userId) return;
    await fetch(`/api/events/${id}/leave-event`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setIsJoined(false);
  };

  const handleCancel = async () => {
    if (!userId) return;
    await fetch(`/api/events/${id}/cancel-event`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    notify(
      "Successfully Canceled Event 🙅",
      "Your orbiters will be notified fo the update"
    );
  };

  const handleDelete = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/events/${id}/delete-event`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        notify("✅ Event deleted", "Your event has been removed.");

        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        notify(
          "Couldn't delete event 😭",
          data.error || "Something went wrong."
        );
      }
    } catch (err) {
      notify("Couldn't delete event 😭", (err as Error).message);
    }
  };

  // const handleAddComment = async () => {
  //   try {
  //     if (!newComment.trim() || !userId) return;

  //     const res = await fetch(`/api/users/${id}/add-comment`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ userId, text: newComment }),
  //     });

  //     if (!res.ok) {
  //       const errData = await res.json().catch(() => ({}));
  //       throw new Error(errData.message || "Failed to add comment.");
  //     }

  //     const data = await res.json();
  //     if (data.comment) {
  //       setComments([data.comment, ...comments]);
  //       setNewComment("");
  //     }

  //     lottieRef.current?.goToAndPlay(0, true);
  //   } catch (e: any) {
  //     notify("Couldn't add comment 😭", e.message || "Something went wrong.");
  //   }
  // };

  // //TODO: DEBUG LOCATION
  // console.log("Event.location:", event?.location);

  return (
    <>
      <div className="z-0">
        <FeedBackground />
      </div>
      {loading ? (
        <LoadingPage />
      ) : !event ? (
        <div className="h-full w-full flex flex-col gap-3 px-3 mt-[-15%] justify-center items-center">
          <Lottie animationData={notFound} className="w-auto mr-6" />
          <h1 className="text-primary text-center font-light z-10">
            Hmm.. we couldn't find this event. Try another?
          </h1>
          <Button
            onPress={() => router.push(`/dashboard`)}
            color="primary"
            variant="shadow"
            size="sm"
          >
            Go Back
          </Button>
        </div>
      ) : (
        <>
          <div className="max-w-2xl mx-auto p-0">
            <Card className="bg-concrete border-none shadow-none">
              <CardHeader className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    onClick={() =>
                      router.push(`/dashboard/profile/${event.host._id}`)
                    }
                  >
                    <Badge
                      placement="top-left"
                      classNames={{
                        base: "bg-none",
                        badge: "bg-transparent p-0 shadow-none border-none",
                      }}
                      content={
                        <CheckBadgeIcon
                          width={18}
                          className="bg-amber-800 border-1 border-amber-600 rounded-full mt-1 ml-1"
                        />
                      }
                    >
                      <Avatar
                        isBordered
                        color="primary"
                        src={event.host.avatar}
                        className="shrink-0 bg-white/20"
                      />
                    </Badge>
                  </div>
                  {/* Text column */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-md truncate font-light text-primary tracking-tighter">
                      {event.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {event.host.firstName} {event.host.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row gap-2 items-center z-10">
                  {" "}
                  <ShieldCheckIcon
                    width={25}
                    className="bg-success p-0.5 shadow-2xl 
                 text-white border border-white rounded-full"
                  />
                  <Image
                    src="/icons/google-maps.png"
                    alt="google_maps_logo"
                    width={18}
                    height={18}
                    className="!min-w-5"
                  />
                  <Image
                    src="/icons/waze.png"
                    alt="waze_logo"
                    width={18}
                    height={18}
                    className="!min-w-5"
                  />
                  <EventActions
                    isHost={isHost}
                    isJoined={isJoined}
                    eventId={event._id}
                    hostId={event.host._id}
                    eventIsPublic={event.public}
                    userId={userId ?? ""}
                    handleDelete={handleDelete} //TODO: Leave for admin application!
                    handleCancel={() => setConfirmCancelOpen(true)}
                    handleLeave={handleLeave}
                    handleJoin={handleJoin}
                    eventStatus={event.status}
                  />
                </div>
              </CardHeader>

              <CardBody className="flex flex-col justify-center gap-1">
                {
                  <>
                    <EventStatusHeader status={event.status} event={event} />
                    <p className="mb-2 font-light text-primary text-center tracking-tight text-sm">
                      {event.description}
                    </p>
                    <p className="text-xs text-center text-gray-400">
                      {new Date(event.date).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </p>

                    <p className="text-xs text-center text-gray-400">
                      {event.location.name}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-primary text-white px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-primary text-sm text-center font-light tracking-tight mt-3">
                      {event.budgetInfo &&
                        `Orbit Goal: ${event.budgetInfo.currency === "USD" ? "$" : ""}${event.budgetInfo.estimatedCost} ${event.budgetInfo.currency}`}
                    </div>
                    {/* type EventDonation = {
                      userId: ObjectId;
                      amount: number;
                      currency: string; // "USD" (default now, extensible later)
                      timestamp: Date;
                      refunded?: boolean; // in case you need to track clawbacks
                    }; */}
                  </>
                }
              </CardBody>
            </Card>
            {attachments && (
              <div className="flex items-center justify-center mt-[-9] bg-black/30">
                <AttachmentSwiper attachments={attachments} />
              </div>
            )}

            <div className="mt-3 w-full text-xs flex flex-col p-0 gap-2 justify-center items-center text-primary">
              <div className="mt-2 z-10 w-[90%] bg-concrete">
                {/* Total raised */}
                <div className="text-sm font-extrabold tracking-wider flex flex-col text-center bg-concrete text-primary">
                  Raised $
                  {event.donations
                    ? event.donations.reduce(
                        (sum: number, d: { amount: number }) => sum + d.amount,
                        0
                      )
                    : 7}{" "}
                  out of ${event.budgetInfo?.estimatedCost ?? 0} to Orbit Goal!
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-300 rounded-full h-2 mt-3">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${
                        event.donations
                          ? Math.min(
                              (event.donations.reduce(
                                (sum: number, d: { amount: number }) =>
                                  sum + d.amount,
                                0
                              ) /
                                (event.budgetInfo?.estimatedCost ?? 1)) *
                                100,
                              100
                            )
                          : Math.min(
                              (7 / (event.budgetInfo?.estimatedCost ?? 1)) *
                                100,
                              100
                            )
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* <Lottie
                animationData={tip}
                style={{ width: "9rem", marginTop: "-.5rem" }}
              /> */}
              <div className="flex flex-row gap-2 mt-3 bg-concrete">
                <Button
                  endContent={<RocketLaunchIcon width={18} />}
                  size="sm"
                  variant="shadow"
                  color="primary"
                >
                  Boost
                </Button>
                <Button
                  endContent={<FireIcon width={18} />}
                  size="sm"
                  variant="ghost"
                  color="primary"
                >
                  Spark
                </Button>
              </div>
            </div>
            {/* Comments */}
            <div className="px-3 my-6 relative">
              {(isHost || isJoined) && (
                <div>
                  <CommentList eventId={event._id} isHost={isHost} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel this Event?"
        description="This will cancel your event and alert your attendees. Continue?"
        confirmLabel="Cancel"
        cancelLabel="Back"
        danger
        onConfirm={handleCancel}
      />
    </>
  );
}
