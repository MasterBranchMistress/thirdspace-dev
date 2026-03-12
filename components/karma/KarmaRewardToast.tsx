"use client";

import { useEffect } from "react";
import Lottie from "lottie-react";
import astro from "@/public/lottie/cheer.json";
import confetti from "canvas-confetti";
import { UserStatusDoc } from "@/lib/models/UserStatusDoc";

type KarmaRewardToastProps = {
  open: boolean;
  label: string;
  amount: number;
  onDone?: () => void;
};

export default function KarmaRewardToast({
  open,
  label,
  amount,
  onDone,
}: KarmaRewardToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onDone?.();
    }, 2200);

    return () => clearTimeout(timer);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      className="fixed top-1/2 left-1/2 z-100
-translate-x-1/2 -translate-y-1/2
animate-appearance-in
p-3 bg-primary/80
rounded-full animate-in fade-in zoom-in-95 duration-200 border-none"
    >
      <div className="flex flex-col p-4 items-center rounded-full border-none bg-none animate-appearance-in">
        <div className="h-full w-[7rem] mt-[-1.5rem] shrink-0 transition-all">
          <Lottie animationData={astro} loop={true} />
        </div>

        <div className="flex flex-col justify-center items-center leading-tight animate-pulse">
          <span className="text-sm font-bold text-white tracking-wider">
            {label}
          </span>
          <span className="text-xs text-secondary tracking-wide font-semibold">
            +{amount} Karma
          </span>
        </div>
      </div>
    </div>
  );
}
