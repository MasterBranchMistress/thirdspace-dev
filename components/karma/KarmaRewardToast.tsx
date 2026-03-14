"use client";

import { useEffect } from "react";
import Lottie from "lottie-react";
import astro from "@/public/lottie/cheer.json";

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
    }, 3000);

    return () => clearTimeout(timer);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      className="fixed top-1/2 left-1/2 z-[100]
      -translate-x-1/2 -translate-y-1/2
      animate-appearance-in
      p-3 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80 backdrop-blur-md
      rounded-xl animate-in fade-in zoom-in-95 duration-200 border-none shadow-2xl"
    >
      <div className="flex flex-col p-3 items-center rounded-full border-none bg-none animate-appearance-in">
        <div className="h-full w-[6rem] mt-[-1.5rem] shrink-0 transition-all">
          <Lottie animationData={astro} loop />
        </div>

        <div className="flex flex-col justify-center items-center leading-tight animate-pulse">
          <span className="font-bold text-center text-xs text-white tracking-wider">
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
