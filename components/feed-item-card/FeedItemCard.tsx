import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
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
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface FeedItemCardProps {
  item: {
    id: string;
    type: string;
    actor: {
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      avatar?: string;
      eventId?: string;
      eventName?: string;
      location?: {
        name: string;
        lat: number;
        lng: number;
      };
      totalAttendance?: number;
      startingDate?: string;
    };

    target: {
      userId?: string;
      snippet?: string;
      location?: string;
      eventId?: string;
      title?: string;
    };
    timestamp: string;
  };
}

export default function FeedItemCard({ item }: FeedItemCardProps) {
  const { type, actor, target, timestamp } = item;
  const router = useRouter();

  const isEvent = (
    actor: any
  ): actor is {
    eventName: string;
    location: { name: string };
    startingDate: string;
    eventId: string;
  } => "eventName" in actor && "location" in actor;

  const buttonText =
    type === "friend_accepted"
      ? `Orbit`
      : type === "joined_event"
        ? `Details`
        : type === "profile_updated"
          ? `Message`
          : `View Event`;

  const message = isEvent(actor)
    ? `📍 "${actor.eventName}" is coming up near you!`
    : type === "friend_accepted"
      ? `${actor.firstName} made a new friend! Be sure to say Hi!`
      : type === "joined_event"
        ? `${actor.firstName} joined "${target.title}"`
        : type === "profile_updated"
          ? `${actor.firstName} updated their profile`
          : `${actor.firstName} did something`;

  const [isFriend, setIsFriend] = React.useState(false);

  return (
    <Card
      radius="none"
      className="w-full shadow-none text-primary bg-concrete mb-3"
    >
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <Avatar
            isBordered
            color="primary"
            radius="full"
            size="md"
            src={isEvent(actor) ? "/misc/jake-the-dog.png" : actor.avatar}
          />

          {isEvent(actor) ? (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-bold tracking-wide leading-none text-primary">
                {actor.eventName}
              </h4>
              <h5 className="text-small tracking-tight text-primary">
                {format(new Date(actor.startingDate), "PPP p")}
              </h5>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-extralight tracking-wider leading-none text-primary">
                {`${actor.firstName} ${actor.lastName}`}
              </h4>
              <h5 className="text-small tracking-tight text-primary">
                @{actor.username}
              </h5>
            </div>
          )}
        </div>
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
      </CardHeader>
      <CardBody className="px-3 py-0 text-small">
        <p className="font-extralight">{message}</p>
        <span className="pt-2">{target.snippet}</span>
        {/* TODO: Reformat backend to grab images from events and users */}
        {target.eventId === "688aacf9161a4669fe86637b" && (
          <Image
            src="/misc/party.jpg"
            alt="Test visual"
            width={400}
            height={250}
            className="rounded-xl my-3 object-cover"
          />
        )}
        {target.eventId === "6886d6cda4b15a3b7a5095a4" && (
          <Image
            src="/misc/diner.jpg"
            alt="Test visual"
            width={400}
            height={250}
            className="rounded-xl my-3 object-cover"
          />
        )}
        {target.eventId === "6886c26ba4b15a3b7a5095a1" && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="rounded-xl my-3 object-cover"
          >
            <source src={"/videos/cat.mp4"} type="video/mp4" />
          </video>
        )}
        {actor.id === "68858a6c2a9706bb46e708ab" && (
          <Image
            src="/misc/date.jpg"
            alt="Test visual"
            width={400}
            height={250}
            className="rounded-xl my-3 object-cover"
          />
        )}
        {actor.id === "68858a7e2a9706bb46e708ac" && (
          <Image
            src="/misc/concert.jpg"
            alt="Test visual"
            width={400}
            height={250}
            className="rounded-xl my-3 object-cover"
          />
        )}
        <span className="text-xs text-primary mt-2">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </CardBody>
      <CardFooter className="gap-3">
        <FeedCardFooter type={type} target={target} />
      </CardFooter>
    </Card>
  );
}
