"use client";

import { UserRanking } from "@/lib/constants";
import { getRankMeta } from "@/utils/karma/getRankIcon";
import Image from "next/image";

type RankBadgeProps = {
  rank?: UserRanking;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
};

export default function RankBadge({
  rank,
  size = "sm",
  showIcon = true,
  className = "",
}: RankBadgeProps) {
  const meta = getRankMeta(rank);

  console.log("rank prop", rank);

  const sizeClasses =
    size === "md"
      ? {
          wrapper: "px-3 py-1.5 text-sm gap-2 rounded-full",
          icon: 18,
        }
      : {
          wrapper: "px-2 py-1 text-xs gap-1.5 rounded-full",
          icon: 14,
        };

  return (
    <div
      className={`inline-flex items-center font-light tracking-tight ${sizeClasses.wrapper} ${meta.className} ${className}`}
    >
      {showIcon && (
        <Image
          src={meta.icon}
          alt={meta.label}
          width={sizeClasses.icon}
          height={sizeClasses.icon}
          className="object-contain"
        />
      )}
      <span>{meta.label}</span>
    </div>
  );
}
