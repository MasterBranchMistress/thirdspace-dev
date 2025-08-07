import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
  Dropdown,
} from "@heroui/react";
import React from "react";
import FeedCardFooter from "./FeedCardFooter";
import { useRouter } from "next/navigation";
import { FeedEventActor, FeedItem, FeedUserActor } from "@/types/user-feed";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import AttachmentSwiper from "../swiper/swiper";
// import { FEED_BUTTON_DROPDOWN_OPTIONS } from "@/lib/constants";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, target, actor, timestamp } = item;

  const router = useRouter();
  // const dropDownItems = FEED_BUTTON_DROPDOWN_OPTIONS;

  const isEvent = (
    actor: FeedUserActor | FeedEventActor
  ): actor is FeedEventActor => {
    return (
      !!actor &&
      typeof (actor as any).eventName === "string" &&
      !!(actor as any).location
    );
  };

  const items = [
    {
      key: "report",
      label: "Report",
    },
    {
      key: "hide",
      label: "Hide",
    },
    {
      key: "block",
      label: "Block User",
    },
  ];

  const title = target?.snippet || "an event";

  const message =
    type === "event_is_popular"
      ? `"${target?.title}" is trending 🔥`
      : type === "event_coming_up"
        ? `"${target?.title}" is coming up ⏰`
        : isEvent(actor)
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
                              : `${actor.firstName} is doing something cool 🤔`;

  const tags =
    type === "profile_tags_updated" && typeof target?.snippet === "string"
      ? target.snippet.split(",").map((tag) => tag.trim())
      : [];

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-3"
    >
      <CardHeader className="flex justify-between items-center mb-2">
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
                  : actor?.avatar || "/misc/party.jpg"
              }
            />
          </div>
          {isEvent(actor) ? (
            <div className="flex flex-col gap-1 items-center justify-center">
              <h6 className="text-small font-semibold justify-center tracking-tight leading-none text-primary">
                {target?.host}'s event has an Update!
              </h6>
              <h5 className="text-small font-light tracking-tight text-primary">
                Starts{" "}
                {actor.startingDate
                  ? format(new Date(actor.startingDate), "PPP p")
                  : "TBD"}
              </h5>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-extralight tracking-wide leading-none text-primary">
                {`${actor?.firstName || ""} ${actor?.lastName || ""}`.trim()}
              </h4>
              <h5 className="text-small tracking-tight text-primary">
                @{actor?.username}
              </h5>
            </div>
          )}
        </div>
        <Dropdown>
          <DropdownTrigger>
            <EllipsisVerticalIcon color="primary" width={30} />
          </DropdownTrigger>
          <DropdownMenu aria-label="Dynamic Actions" items={items}>
            {(item) => (
              <DropdownItem
                key={item.key}
                className={item.key === "delete" ? "text-danger" : ""}
                color={item.key === "delete" ? "danger" : "default"}
              >
                {item.label}
              </DropdownItem>
            )}
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-center tracking-tight font-light">
        <p className="font-bold text-center tracking-tight">{message}</p>
        <div className="flex flex-col justify-center items-center">
          {type === "profile_bio_updated" && target?.snippet && (
            <span className="font-light mt-2">{target.snippet}</span>
          )}
          {type === "profile_status_updated" && (
            <div className="mt-2 tracking-tight font-normal text-sm">
              <p>{target?.snippet}</p>

              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}

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
                    {target.attachments.map((url) =>
                      url ? (
                        <img
                          key={url}
                          src={url}
                          alt="status attachment"
                          className="w-full h-auto object-cover rounded-md"
                          loading="lazy"
                        />
                      ) : null
                    )}
                  </div>
                )}
            </div>
          )}
          {type === "profile_location_updated" && (
            <div className="mt-2 tracking-tight font-bold">
              {target?.snippet}
            </div>
          )}
          {type === "event_is_popular" && (
            <div className="font-light mt-3 tracking-tight">
              {target?.description}
            </div>
          )}
          {type === "event_coming_up" && (
            <div className="my-3 font-light tracking-tight">
              {target?.description}
            </div>
          )}
        </div>
        <span className="text-xs text-primary tracking-tight font-bold text-center mt-2">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="flex gap-2 px-2 w-full">
        <FeedCardFooter type={type} target={target} actor={actor} />
      </CardFooter>
    </Card>
  );
}
