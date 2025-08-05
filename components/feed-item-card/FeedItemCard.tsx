import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Button,
} from "@heroui/react";
import React from "react";
import FeedCardFooter from "./FeedCardFooter";
import { useRouter } from "next/navigation";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, target, actor, timestamp } = item;

  const router = useRouter();

  const isEvent = (
    actor: FeedUserActor | FeedEventActor
  ): actor is FeedEventActor => {
    return (
      !!actor &&
      typeof (actor as any).eventName === "string" &&
      !!(actor as any).location
    );
  };

  const buttonText =
    type === "friend_accepted"
      ? `Boost 🚀`
      : type === "joined_event"
        ? `Orbit 🪐`
        : type === "status_posted"
          ? `Boost 🚀`
          : type === "profile_updated"
            ? `Follow`
            : type === "hosted_event"
              ? "Orbit 🪐"
              : type === "profile_status_updated"
                ? `Follow`
                : type === "profile_bio_updated"
                  ? "Read Bio"
                  : type === "profile_tags_updated"
                    ? "Explore Tags"
                    : type === "profile_location_updated"
                      ? "Explore 🛸"
                      : "View";

  const title = target?.snippet || "an event";

  const message = isEvent(actor)
    ? `📍 "${actor.eventName}" is coming up near you!`
    : type === "friend_accepted"
      ? `${actor.firstName} has a new Orbiter!`
      : type === "joined_event"
        ? `${actor.firstName} joined "${title}"`
        : type === "status_posted"
          ? ``
          : type === "hosted_event"
            ? `${actor.firstName} is hosting "${title}"`
            : type === "created_event"
              ? `${actor.firstName} just created "${title}"`
              : type === "profile_bio_updated"
                ? `${actor.firstName} wrote in their bio 📝`
                : type === "profile_avatar_updated"
                  ? `${actor.firstName} updated their look 😎`
                  : type === "profile_location_updated"
                    ? `${actor.firstName} moved somewhere new 📍`
                    : type === "profile_tags_updated"
                      ? `${actor.firstName} picked new interests 🧠`
                      : type === "profile_status_updated"
                        ? ``
                        : type === "event_is_popular"
                          ? `"${title}" is getting popular 🔥`
                          : type === "event_coming_up"
                            ? `Don't forget — "${title}" is coming up ⏰`
                            : `${actor.firstName} is doing something cool 🤔`;

  const [isFriend, setIsFriend] = React.useState(false);

  const tags =
    type === "profile_tags_updated" && typeof target?.snippet === "string"
      ? target.snippet.split(",").map((tag) => tag.trim())
      : [];

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-3"
    >
      <CardHeader className="justify-between mb-2">
        <div className="flex gap-5">
          <div className="hover:cursor-pointer">
            <Avatar
              isBordered
              color="primary"
              radius="full"
              size="md"
              src={
                isEvent(actor)
                  ? "/misc/jake-the-dog.png"
                  : actor?.avatar || "/misc/placeholder-avatar.png"
              }
            />
          </div>
          {isEvent(actor) ? (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-bold tracking-wide leading-none text-primary">
                {actor.eventName}
              </h4>
              <h5 className="text-small font-light tracking-tight text-primary">
                {actor.startingDate
                  ? format(new Date(actor.startingDate), "PPP p")
                  : "TBD"}
              </h5>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-extralight tracking-wider leading-none text-primary">
                {`${actor?.firstName || ""} ${actor?.lastName || ""}`.trim()}
              </h4>
              <h5 className="text-small tracking-tight text-primary">
                @{actor?.username}
              </h5>
            </div>
          )}
        </div>
        <div className="flex flex-row justify-end gap-1">
          <Button
            className={
              !isFriend
                ? "bg-concrete text-primary border-1 border-primary font-light shadow-none"
                : "bg-primary text-concrete"
            }
            color="secondary"
            radius="full"
            size="sm"
            variant={isFriend ? "flat" : "solid"}
            onPress={() => setIsFriend(!isFriend)}
          >
            {buttonText}
          </Button>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-center font-light">
        <p className="font-light text-center tracking-wide">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-bold mt-2">{target.snippet}</span>
          )}
          {type === "profile_status_updated" && target?.snippet}
          {type === "friend_accepted" && (
            <div className="mt-2">
              Send a shout to {title} if you know them!
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 tracking-wide">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-indigo-100 text-primary text-xs font-semibold px-2.5 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {type === "status_posted" && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-primary font-light tracking-wide">
                {title}
              </p>
              {Array.isArray(target?.attachments) &&
                target.attachments.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {target.attachments.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="status attachment"
                        className="w-full h-auto object-cover rounded-md"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
            </div>
          )}
          {type === "profile_location_updated" && (
            <div className="mt-2 tracking-tight font-bold">
              {target?.snippet}
            </div>
          )}
          {type === "profile_username_updated" && !isEvent(actor) && (
            <div className="mt-1 font-bold">{actor.username}</div>
          )}
        </div>
        <span className="text-xs text-primary text-center mt-2">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="gap-3">
        <FeedCardFooter type={type} target={target} actor={actor} />
      </CardFooter>
    </Card>
  );
}
