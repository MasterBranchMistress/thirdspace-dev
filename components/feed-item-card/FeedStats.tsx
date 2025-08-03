import {
  ChatBubbleLeftEllipsisIcon,
  FireIcon,
  HeartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { faker } from "@faker-js/faker";
import { useMemo } from "react";

export function FeedStats() {
  const stats = useMemo(
    () => ({
      followers: faker.number.int({ min: 1, max: 1000 }),
      comments: faker.number.int({ min: 5, max: 100 }),
      likes: faker.number.int({ min: 20, max: 300 }),
      heat: faker.number.int({ min: 10, max: 75 }),
    }),
    []
  );
  return (
    <>
      <div className="flex gap-1 items-center align-middle">
        <UserGroupIcon width={12} className="w-4 h-4 text-primary" />
        <p className="font-extrabold text-small">{stats.followers}</p>
      </div>
      <div className="flex gap-1 items-center align-middle">
        <ChatBubbleLeftEllipsisIcon
          width={12}
          className="w-4 h-4 text-primary"
        />
        <p className="font-extrabold text-small">{stats.comments}</p>
      </div>
      <div className="flex gap-1 items-center align-middle">
        <HeartIcon width={12} className="w-4 h-4 text-primary" />
        <p className="font-extrabold text-small">{stats.likes}</p>
      </div>
      <div className="flex gap-1 items-center align-middle">
        <FireIcon width={12} className="w-4 h-4 text-primary" />
        <p className="font-extrabold text-small">{stats.heat}</p>
      </div>
    </>
  );
}
