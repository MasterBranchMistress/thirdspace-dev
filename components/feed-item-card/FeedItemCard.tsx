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
import detectMediaType from "@/utils/detect-media-type/detectMediaType";
// import { FEED_BUTTON_DROPDOWN_OPTIONS } from "@/lib/constants";

interface FeedItemCardProps {
  item: FeedItem;
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, target, actor, timestamp } = item;

  const isUserActor = (
    a: FeedUserActor | FeedEventActor | null | undefined
  ): a is FeedUserActor => {
    return !!a && typeof (a as any).id === "string";
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
      : type === "event_coming_up" && !isUserActor(actor)
        ? `"${target?.title}" is coming up ⏰`
        : type === "hosted_event" && isUserActor(actor)
          ? `${actor.firstName}`
          : type === "friend_accepted" && isUserActor(actor)
            ? `${actor.firstName} has a new Orbiter!`
            : type === "joined_event" && isUserActor(actor)
              ? `${actor.firstName} joined "${title}"`
              : type === "created_event" && isUserActor(actor)
                ? `${actor.firstName} just created "${title}"`
                : type === "profile_bio_updated" && isUserActor(actor)
                  ? `${actor.firstName} wrote in their bio 📝`
                  : type === "profile_avatar_updated" && isUserActor(actor)
                    ? `${actor.firstName} updated their look 😎`
                    : type === "profile_location_updated" && isUserActor(actor)
                      ? `${actor.firstName} moved somewhere new 📍`
                      : type === "profile_tags_updated" && isUserActor(actor)
                        ? `${actor.firstName} picked new interests 🧠`
                        : type === "profile_status_updated" &&
                            isUserActor(actor)
                          ? ``
                          : isUserActor(actor) &&
                            `${actor.firstName} is doing something cool 🤔`;

  const tags =
    type === "profile_tags_updated" && typeof target?.snippet === "string"
      ? target.snippet.split(",").map((tag) => tag.trim())
      : [];

  // console.log("event host: ", target?.hostName);

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-3"
    >
      <CardHeader className="flex justify-between items-center">
        <div className="flex gap-5">
          <div className="hover:cursor-pointer">
            <Avatar
              isBordered
              color="primary"
              radius="full"
              size="md"
              src={
                isUserActor(actor)
                  ? actor?.avatar
                  : actor?.avatar || "/misc/party.jpg"
              }
            />
          </div>
          {!isUserActor(actor) ? (
            <div className="flex flex-col gap-1 items-center justify-center">
              <h6 className="text-small font-semibold justify-center tracking-tight leading-none text-primary">
                {target?.host ?? target?.hostName}'s event has an Update!
              </h6>
              <h5 className="text-small font-light tracking-tight text-primary">
                Starts{" "}
                {target?.startingDate
                  ? format(new Date(target?.startingDate), "PPP p")
                  : "TBD"}
              </h5>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-extralight tracking-wide leading-none text-primary">
                {`${actor?.firstName || ""} ${actor?.lastName || ""}`.trim()}
              </h4>
              {isUserActor(actor) && (
                <h5 className="text-small tracking-tight text-primary">
                  @{actor?.username}
                </h5>
              )}
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
            <span className="font-light mt-2 w-85">{target.snippet}</span>
          )}
          {type === "profile_status_updated" && (
            <div className="mt-2 tracking-tight font-normal text-sm">
              <p className="w-85">{target?.snippet}</p>

              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
          {type === "hosted_event" && !isUserActor(actor) && (
            <div className="mt-2 tracking-tight font-normal text-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="font-bold pb-1">{target?.title}</div>
                <div className="tracking-tight text-sm w-85">
                  {target?.snippet}
                </div>
              </div>

              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}

          {/* TODO: Friend updates might be uneccessary. Will decide later*/}
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
          {type === "profile_location_updated" && (
            <div className="mt-2 tracking-tight font-bold">
              {target?.snippet}
              {target?.attachments && target.attachments.length > 0 && (
                <div
                  className="h-full overflow-hidden"
                  style={{ marginBottom: "-2rem" }}
                >
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
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
              {target?.attachments && target.attachments.length > 0 && (
                <div className="h-full overflow-hidden">
                  <AttachmentSwiper attachments={target.attachments} />
                </div>
              )}
            </div>
          )}
        </div>
        <span className="text-xs z-20 text-primary tracking-tight font-bold text-center mt-2">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="flex gap-2 px-2 w-full z-30">
        <FeedCardFooter type={type} target={target} actor={actor} />
      </CardFooter>
    </Card>
  );
}
