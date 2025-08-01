// components/FloatingBackButton.tsx
"use client";
import { Button } from "@heroui/react";
import backButton from "../../public/icons/back-button.png";
import Image from "next/image";
import React from "react";
import { Tooltip } from "@heroui/react";

interface Props {
  onClick: () => void;
}

export default function FloatingBackButton({ onClick }: Props) {
  return (
    <Tooltip
      content="Go Back"
      delay={1000}
      className="bg-transparent text-purple-bold"
    >
      <button
        onClick={onClick}
        className="absolute bottom-6 left-20 z-20 flex items-center animate-pulse space-x-2 hover:animate-point-left"
      >
        <Image
          src={backButton}
          height={30}
          width={30}
          alt="back-button"
        ></Image>
      </button>
    </Tooltip>
  );
}
