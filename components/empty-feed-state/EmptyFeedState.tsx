import Image from "next/image";
import { Button } from "@heroui/button";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { FeedBackground } from "../background-animations/UserFeedBackground";

interface EmptyFeedStateProps {
  name?: string;
}

export default function EmptyFeedState({ name }: EmptyFeedStateProps) {
  return (
    <div className="flex flex-col gap-3 text-primary items-center justify-center text-center min-h-screen px-4 py-12 bg-muted/50 z-10">
      <FeedBackground />
      <h1 className="text-2xl font-extrabold text-primary z-10">
        Welcome, {name}!
      </h1>
      <h2 className="text-2xl font-light text-primary z-10">
        Your Orbit is Quiet... 😴
      </h2>
      <p className="text-muted-foreground mt-2 max-w-md font-extralight z-10">
        Looks like your feed’s a little empty. Once your friends start joining
        events, you'll see their activity here.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-4 text-primary">
        <Link href="/friends/search">
          <Button
            variant="flat"
            className="bg-transparent border-1 border-primary text-primary"
            spinner={<Spinner variant="wave" color="primary" />}
          >
            Find Events
          </Button>
        </Link>
        <Link href="/events/create">
          <Button
            className="bg-primary"
            spinner={<Spinner variant="wave" color="secondary" />}
          >
            Create Your First Event
          </Button>
        </Link>
      </div>
    </div>
  );
}
