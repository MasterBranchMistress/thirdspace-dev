// components/feed-item-card/GreetingHeader.tsx
"use client";

import { useSession } from "next-auth/react";

export default function GreetingHeader() {
  const { data: session } = useSession();
  const hour = new Date().getHours();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Welcome back";
  };

  const offHours = hour >= 22 && hour <= 5;

  return (
    <div className="w-full pb-7 z-10 text-center animate-appearance-in">
      <h1 className="text-2xl font-light text-primary tracking-tight">
        {getGreeting()}, {session?.user?.firstName}
        {offHours ? "?" : " 👋"}
      </h1>
      <p className="text-sm text-primary">Here’s what's in your Orbit.</p>
    </div>
  );
}
