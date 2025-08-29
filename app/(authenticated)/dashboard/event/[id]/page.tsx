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
  CheckBadgeIcon,
  EllipsisVerticalIcon,
  FireIcon,
  HandThumbUpIcon,
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
  event: Comment;
  _id: string;
  title: string;
  status: string;
  description: string;
  date: string;
  startTime: string;
  tags: string[];
  location: { name: string };
  comments: Comment[];
  host: {
    _id: string;
    avatar: string;
    firstName: string;
    lastName: string;
  };
  attendees: string[];
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

  console.log(userId);

  //fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [eventRes, commentRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/users/${id}/get-comments`),
        ]);

        const eventData = await eventRes.json();
        const commentData = await commentRes.json();

        setEvent(eventData);
        console.log(eventData);

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

  // Handlers
  const handleJoin = async () => {
    if (!userId) return;
    await fetch(`/api/events/${id}/join-event`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setIsJoined(true);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
    notify(
      "Successfully Joined Event 🎉",
      "You can now participate in the conversaion with other orbiters"
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

  const handleAddComment = async () => {
    try {
      if (!newComment.trim() || !userId) return;

      const res = await fetch(`/api/users/${id}/add-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: newComment }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to add comment.");
      }

      const data = await res.json();
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setNewComment("");
      }

      lottieRef.current?.goToAndPlay(0, true);
    } catch (e: any) {
      notify("Couldn't add comment 😭", e.message || "Something went wrong.");
    }
  };

  if (loading)
    return (
      <Spinner
        variant="dots"
        color="primary"
        className="flex flew row justify-center items-center h-full"
      />
    );
  if (!event)
    return <p className="text-center text-red-500">Event not found</p>;

  return (
    <>
      <div className="z-0">
        <FeedBackground />
      </div>
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
                handleDelete={handleDelete}
                handleCancel={handleCancel}
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
              </>
            }
          </CardBody>
        </Card>
        {attachments && (
          <div className="flex items-center justify-center bg-black/30">
            <AttachmentSwiper attachments={attachments} />
          </div>
        )}
        {/* Comments */}
        <div className="px-3 my-6 relative">
          <div className="flex items-center gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // avoid newline
                  handleAddComment();
                }
              }}
              placeholder="Add a comment..."
              variant="underlined"
              color="primary"
              className="flex-1 bg-transparent z-10 text-primary"
              size="sm"
            />
            <div onClick={handleAddComment} className="cursor-pointer">
              <Lottie
                lottieRef={lottieRef}
                animationData={send}
                onComplete={() => {
                  lottieRef.current?.goToAndStop(0, true);
                }}
                loop={false}
                autoplay={false}
                style={{ width: "3rem" }}
              />
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="flex flex-col justify-center items-center my-9">
              <Lottie animationData={noComments} style={{ width: "15rem" }} />
              <h1 className="z-10 text-primary font-extralight tracking-tight">
                Be the first to comment!
              </h1>
            </div>
          ) : (
            <ul className="my-3">
              {comments.map((c, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 z-10 bg-concrete p-2 rounded-md"
                >
                  {/* Avatar */}
                  <Avatar
                    src={c.commenter.avatar}
                    size="sm"
                    isBordered
                    color="primary"
                    className="mr-1 mt-0.5"
                    onClick={() =>
                      router.push(`/dashboard/profile/${String(c.userId)}`)
                    }
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-primary font-bold">
                        @{c.commenter.username || "Anon"}{" "}
                        <span className="font-extralight tracking-tight ml-1">
                          {formatDistanceToNow(c.timestamp, {
                            addSuffix: true,
                          })}
                        </span>
                      </p>
                      <EllipsisVerticalIcon
                        width={18}
                        className="text-primary cursor-pointer"
                      />
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-primary">{c.text}</p>

                    {/* Fire/reactions row */}
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex flex-row items-center gap-1">
                        <FireIcon width={16} className="text-primary" />
                        <span className="text-[12px] text-gray-400 mt-0.5">
                          {c.sparks}
                        </span>
                      </div>
                      <div className="flex flex-row items-center gap-1">
                        <HandThumbUpIcon width={16} className="text-primary" />
                        <span className="text-[12px] text-gray-400 mt-0.5">
                          {c.likes}
                        </span>
                      </div>
                      <button className="text-primary text-xs">Reply</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
