import { faker } from "@faker-js/faker";
import { useEffect, useMemo, useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import Lottie from "lottie-react";
import ViewsIcon from "@/public/lottie/eye.json";
import {
  ArrowPathRoundedSquareIcon,
  ArrowRightStartOnRectangleIcon,
  EyeIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import {
  getStatusInfo,
  StatusData,
} from "@/utils/feed-item-actions/getStatusInfo";
import { useToast } from "@/app/providers/ToastProvider";
import { useSession } from "next-auth/react";
import { viewStatus } from "@/utils/feed-item-actions/viewStatus";

type FeedStatsProps = {
  statusId: string;
};

export function FeedStats({ statusId }: FeedStatsProps) {
  const [info, setInfo] = useState<StatusData | null>(null);
  const { notify } = useToast();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    (async () => {
      try {
        const info = await getStatusInfo(user, statusId);
        setInfo(info);
      } catch (err) {
        console.log("something went wrong:", err);
      }
    })();
  }, [statusId, user]);

  console.log("status Id: ", statusId);
  console.log("info?:", info?.views);

  const handleView = () => void viewStatus({ loggedInUser: user, statusId });

  const stats = useMemo(
    () => ({
      views: info?.views ?? 0,
      comments: faker.number.int({ min: 5, max: 100 }),
      likes: faker.number.int({ min: 20, max: 300 }),
      heat: faker.number.int({ min: 10, max: 75 }),
    }),
    [],
  );
  return (
    <>
      <Tooltip content={`Views`}>
        <div className="flex gap-2 items-center align-middle">
          <Button
            // hidden={!info?.views}
            isIconOnly
            color="primary"
            variant="light"
            onPress={handleView}
          >
            <Lottie
              animationData={ViewsIcon}
              autoplay={false}
              loop
              style={{
                height: "25px",
                width: "25px",
              }}
            />
          </Button>
          {/*TODO: make this a view count below */}
          <p className="font-extrabold text-small">{info?.views}</p>
        </div>
      </Tooltip>
      <Tooltip content={"Reposts"}>
        <div className="flex gap-2 items-center align-middle">
          <Button isIconOnly color="primary" variant="light">
            <ArrowPathRoundedSquareIcon width={20} />
          </Button>
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
        <div className="flex items-center align-middle">
          <Button isIconOnly color="primary" variant="light">
            <FireIcon width={20} />
          </Button>
          <p className="font-extrabold text-small">{stats.heat}</p>
        </div>
      </Tooltip>
    </>
  );
}
