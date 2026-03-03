import { Avatar, AvatarGroup } from "@heroui/react";
import { useSession } from "next-auth/react";

type PreviewUser = { id: string; firstName: string; avatar?: string };

type Props = {
  hasSparked?: boolean;
  friendPreviewUsers?: PreviewUser[];
};

export default function SparkMeta({
  hasSparked = false,
  friendPreviewUsers = [],
}: Props) {
  const { data: session } = useSession();

  const me: PreviewUser | null = session?.user?.id
    ? {
        id: session.user.id,
        firstName: "You",
        avatar: session.user.avatar,
      }
    : null;

  // build avatar list: me first (if sparked), then friends (excluding me)
  const friendsSansMe = friendPreviewUsers.filter(
    (u) => !me || String(u.id) !== String(me.id),
  );

  const avatars = [...(hasSparked && me ? [me] : []), ...friendsSansMe].slice(
    0,
    3,
  );

  const showAnything = hasSparked || friendsSansMe.length > 0;
  if (!showAnything) return null;

  const label =
    hasSparked && friendsSansMe.length > 0
      ? `You and ${friendsSansMe[0].firstName} sparked this`
      : hasSparked
        ? "You sparked this"
        : friendsSansMe.length === 1
          ? `${friendsSansMe[0].firstName} sparked this`
          : `${friendsSansMe[0].firstName} and ${friendsSansMe.length - 1} other${friendsSansMe.length < 2 ? `s` : ``} sparked this`;

  return (
    <div className="mt-3 min-h-[16px] text-xs text-gray-400">
      <span className="flex items-center gap-2">
        {avatars.length > 0 && (
          <AvatarGroup>
            {avatars.map((u) => (
              <Avatar key={u.id} size="sm" src={u.avatar} />
            ))}
          </AvatarGroup>
        )}
        <span>{label}</span>
      </span>
    </div>
  );
}
