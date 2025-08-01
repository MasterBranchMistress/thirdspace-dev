// components/FloatingForwardButton.tsx
"use client";
import { Button, Tooltip } from "@heroui/react";
import forwardButton from "../../public/icons/forward-button.png";
import { Image } from "@heroui/react";
import React from "react";

interface Props {
  skipIntro: () => void;
}

export default function FloatingForwardButton({ skipIntro }: Props) {
  return (
    <Tooltip content="Next Step" className="bg-transparent text-purple-bold">
      <button
        onClick={skipIntro}
        className="absolute bottom-6 right-20 animate-pulse z-20 flex items-center space-x-2 hover:animate-point-right"
      >
        <Image
          isZoomed
          src={"/icons/forward-button.png"}
          height={30}
          width={30}
          alt="forward-button"
          className="animate-pointRight"
        />
      </button>
    </Tooltip>
  );
}
