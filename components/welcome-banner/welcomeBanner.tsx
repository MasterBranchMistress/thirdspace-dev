"use client";

import { FOUNDER_WELCOME_POST } from "@/lib/constants";
import { Avatar } from "@heroui/react";

type Props = {
  firstName: string;
};

export default function WelcomeBanner({ firstName }: Props) {
  return (
    <div className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-[-1rem] rounded-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
      <div className="flex flex-col justify-center text-center text-white leading-tight">
        <span className="text-sm font-semibold mb-2">
          Welcome to ThirdSpace, {firstName}! 🚀
        </span>
        <span className="text-xs opacity-90">
          Discover people, events, and things happening around you.
        </span>
      </div>
    </div>
  );
}
