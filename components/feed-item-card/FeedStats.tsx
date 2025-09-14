import { faker } from "@faker-js/faker";
import { useMemo } from "react";
import { Tooltip } from "@heroui/react";
import Lottie from "lottie-react";
import ViewsIcon from "@/public/lottie/eye.json";
import HeartsIcon from "@/public/lottie/hearts.json";
import CommentsIcon from "@/public/lottie/comments.json";
import BoostIcon from "@/public/lottie/fire.json";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightStartOnRectangleIcon,
  EyeIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/solid";

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
      <Tooltip content={`Views`}>
        <div className="flex gap-2 items-center align-middle">
          <Lottie
            animationData={ViewsIcon}
            autoplay={false}
            loop
            style={{
              height: "25px",
              width: "25px",
            }}
          />
          {/*TODO: make this a view count below */}
          <p className="font-extrabold text-small">{stats.followers}</p>
        </div>
      </Tooltip>
      <Tooltip content={"Reposts"}>
        <div className="flex gap-2 items-center align-middle">
          <ArrowPathRoundedSquareIcon width={20} />
          <p className="font-extrabold text-small">{stats.comments}</p>
        </div>
      </Tooltip>
      <Tooltip content={"Shares"}>
        <div className="flex gap-2 items-center align-middle">
          <ArrowRightStartOnRectangleIcon width={20} />
          <p className="font-extrabold text-small">{stats.likes}</p>
        </div>
      </Tooltip>
      <Tooltip content={"Sparks"}>
        <div className="flex gap-2 items-center align-middle">
          <FireIcon width={20} />
          <p className="font-extrabold text-small">{stats.heat}</p>
        </div>
      </Tooltip>
    </>
  );
}
