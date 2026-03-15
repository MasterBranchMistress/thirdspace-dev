"use client";

import { Avatar, AvatarGroup } from "@heroui/react";
import { useSession } from "next-auth/react";

type PreviewUser = {
  id: string;
  firstName: string;
  avatar?: string;
};

type Props = {
  hasBoosted?: boolean;
  boostPreviewUsers?: PreviewUser[];
  optimisticBoosted?: boolean;
};

export default function BoostMeta({
  hasBoosted = false,
  boostPreviewUsers = [],
  optimisticBoosted = false,
}: Props) {
  const { data: session } = useSession();

  const viewerId = session?.user?.id;

  const me: PreviewUser | null = viewerId
    ? {
        id: viewerId,
        firstName: "You",
        avatar: session?.user?.avatar,
      }
    : null;

  const others = boostPreviewUsers.filter(
    (u) => !viewerId || String(u.id) !== String(viewerId),
  );

  const avatars = [...(hasBoosted && me ? [me] : []), ...others].slice(0, 3);

  if (!hasBoosted && others.length === 0) return null;

  const firstOther = others[0]?.firstName ?? "Someone";

  let label = "";

  if (hasBoosted && others.length > 0) {
    label = `You and ${firstOther} boosted this`;
  } else if (hasBoosted) {
    label = "You boosted this";
  } else if (others.length === 1) {
    label = `${firstOther} boosted this`;
  } else {
    const remaining = others.length - 1;
    label = `${firstOther} and ${remaining} other${remaining === 1 ? "" : "s"} boosted this`;
  }

  return (
    <div className="mt-3 min-h-[16px] text-xs text-default-500">
      <div className="flex items-center gap-2">
        {avatars.length > 0 && (
          <AvatarGroup
            max={3}
            size="sm"
            isBordered={false}
            classNames={{
              count: "text-xs text-default-500 bg-transparent",
            }}
          >
            {avatars.map((u) => (
              <Avatar key={u.id} size="sm" src={u.avatar} name={u.firstName} />
            ))}
          </AvatarGroup>
        )}

        <span className="text-gray-400">{label}</span>
      </div>
    </div>
  );
}
