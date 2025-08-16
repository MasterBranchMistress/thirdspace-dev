import Lottie from "lottie-react";
import { Button } from "@heroui/button";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import animationData from "@/public/lottie/empty-state.json";

interface EmptyFeedStateProps {
  name?: string;
}

export default function EmptyFeedState({ name }: EmptyFeedStateProps) {
  return (
    <div className="flex flex-col gap-2 text-primary items-center justify-center text-center px-4 py-12 bg-muted/50 z-10">
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ height: "300px", width: "300px" }}
      />
      <h1 className="text-2xl font-extralight tracking-wider text-primary z-10">
        Welcome, {name}! 👋
      </h1>
      {/* <h2 className="text-2xl font-light text-primary z-10">
        Your Orbit is Quiet...
      </h2> */}
      <p className="text-muted-foreground tracking-tighter mb-2 max-w-md font-extralight z-10">
        Looks like your feed’s a little empty. Once your friends start joining
        events, you'll see their activity here.
      </p>
      <div className="mt-2 flex flex-col sm:flex-row gap-4 text-primary">
        <Link href="/friends/search">
          <Button
            variant="flat"
            className="bg-transparent border-1 border-primary text-primary tracking-tighter"
            spinner={<Spinner variant="wave" color="primary" />}
          >
            Find Friends
          </Button>
        </Link>
        <Link href="/events/create">
          <Button
            className="bg-primary tracking-tighter"
            spinner={<Spinner variant="wave" color="secondary" />}
          >
            Browse Events
          </Button>
        </Link>
      </div>
    </div>
  );
}
