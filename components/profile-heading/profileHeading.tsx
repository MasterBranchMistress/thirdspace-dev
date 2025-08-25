"use client";

import { useState } from "react";
import {
  Card,
  CardFooter,
  Image,
  Button,
  CardHeader,
  Chip,
} from "@heroui/react";
import { UserDoc } from "@/lib/models/User";
import {
  ChatBubbleLeftRightIcon,
  FireIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

export default function ProfileHeading({
  disabled,
  user,
}: {
  disabled?: boolean;
  user: UserDoc;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <Card
      isFooterBlurred
      className="border-none relative shadow-2xl overflow-hidden"
      radius="none"
    >
      {/* Overlayed header */}
      <CardHeader
        className="absolute top-0 z-20
        flex flex-col items-start
        w-full px-3 py-2
        bg-gradient-to-b from-black/60 to-transparent"
      >
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-col">
            <h1 className="text-sm font-light tracking-tight text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-white text-xs font-extralight tracking-tight">
              @{user.username}
            </p>
          </div>
          <div>
            <button className="hover:cursor-pointer">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Background image */}
      <Image
        alt={`${user.firstName} Profile photo`}
        className="object-cover z-0 h-64"
        height={300}
        radius="none"
        src={user.avatar}
        width={500}
      />

      {/* Transparent button overlay */}
      <button
        onClick={() => setShowOverlay(!showOverlay)}
        className="absolute inset-0 z-10 bg-transparent cursor-pointer"
        aria-label="Show bio and tags"
        disabled={disabled}
      />

      {/* Overlay content */}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 
            flex flex-col justify-center items-center p-4 text-center space-y-3 animate-fade-in"
          onClick={() => setShowOverlay(false)}
        >
          <p className="text-sm font-light mb-6 text-white italic">
            {user.bio || "No bio provided."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {user.tags?.map((tag) => (
              <Chip key={tag} color="primary" variant="shadow" size="sm">
                #{tag}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <CardFooter
        className="justify-between before:bg-white/10 border-white/20 border-1 
        overflow-hidden py-1 absolute rounded-none bottom-[-8] 
        shadow-small z-20 mb-2"
      >
        <Button
          className="text-tiny text-white tracking-tighter bg-black/20 border-white/20 border-1 "
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
          disabled={disabled}
        >
          <UserPlusIcon width={17} />
          Friend
        </Button>
        <Button
          className="text-tiny tracking-tighter text-white bg-black/20 border-white/20 border-1 "
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
          disabled={disabled}
        >
          <RocketLaunchIcon width={17} />
          Follow
        </Button>
        <Button
          className="text-tiny text-white tracking-tighter bg-black/20 border-white/20 border-1 "
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
          disabled={disabled}
        >
          <FireIcon width={17} /> Spark
        </Button>
        <Button
          className="text-tiny text-white tracking-tighter bg-black/20 border-white/20 border-1 "
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
          disabled={disabled}
        >
          <HandRaisedIcon width={17} /> Block
        </Button>
      </CardFooter>
    </Card>
  );
}
