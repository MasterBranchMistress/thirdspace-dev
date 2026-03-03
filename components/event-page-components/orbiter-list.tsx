import { Avatar, AvatarGroup } from "@heroui/react";

export type Attendee = {
  _id: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

export function OrbiterList({
  attendeeUsers = [],
  maxVisible = 8,
}: {
  attendeeUsers?: Attendee[];
  maxVisible?: number;
}) {
  const visible = attendeeUsers.slice(0, maxVisible);
  const extra = attendeeUsers.length - visible.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        <AvatarGroup isBordered max={8}>
          {attendeeUsers.map((a) => (
            <Avatar
              key={a._id}
              src={a.avatar}
              name={
                `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() ||
                a.username ||
                "Attendee"
              }
              className="border-2 border-background"
              size="sm"
            />
          ))}
        </AvatarGroup>
      </div>
      <div className="text-sm text-primary">
        {attendeeUsers.length === 0
          ? "No one here yet. Be the first to Orbit!"
          : `${attendeeUsers.length} going`}
        {extra > 0 ? ` (+${extra})` : ""}
      </div>
    </div>
  );
}
