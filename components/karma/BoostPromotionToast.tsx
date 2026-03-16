"use client";

import { useEffect } from "react";
import Lottie from "lottie-react";
import rocket from "@/public/lottie/boost.json";

type BoostToastProps = {
  open: boolean;
  onDone?: () => void;
};

export default function BoostToast({ open, onDone }: BoostToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onDone?.();
    }, 6000); // shorter than karma toast

    return () => clearTimeout(timer);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div
      className="fixed top-[75%] left-1/2 z-[100]
      -translate-x-1/2 -translate-y-1/2
      pointer-events-none
      animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex flex-col items-center">
        <div
          className="w-[6rem]
          animate-boost-launch"
        >
          <Lottie animationData={rocket} loop={true} />
        </div>
      </div>
    </div>
  );
}
