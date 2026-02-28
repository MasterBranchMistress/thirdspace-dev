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
} from "@/utils/feed-item-actions/status-item-actions/getStatusInfo";
import { useToast } from "@/app/providers/ToastProvider";
import { useSession } from "next-auth/react";
import { viewStatus } from "@/utils/feed-item-actions/status-item-actions/viewStatus";
import { viewEvent } from "@/utils/feed-item-actions/event-item-actions/viewEvent";
import {
  EventData,
  getEventInfo,
} from "@/utils/feed-item-actions/event-item-actions/getEventInfo";

type FeedStatsProps = {
  statusId: string;
  eventId: string;
};

type FeedInfo =
  | { type: "status"; data: StatusData }
  | { type: "event"; data: EventData };

export function FeedStats({ statusId, eventId }: FeedStatsProps) {
  const [info, setInfo] = useState<FeedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        if (!user || (!statusId && !eventId)) {
          if (!cancelled) setInfo(null);
          return;
        }
        if (statusId) {
          const statusInfo = await getStatusInfo(user, statusId);
          if (!cancelled) setInfo({ type: "status", data: statusInfo });
          return;
        }
        if (eventId) {
          const eventInfo = await getEventInfo(user, eventId);
          if (!cancelled) setInfo({ type: "event", data: eventInfo });
          return;
        }
      } catch (err) {
        console.log("something went wrong:", err);
        if (!cancelled) setError("Failed to load stats");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, statusId, eventId]);

  const handleView = () => {
    statusId
      ? viewStatus({ loggedInUser: user, statusId })
      : viewEvent({ loggedInUser: user, eventId });
  };

  const stats = useMemo(
    () => ({
      views: info?.data.views ?? 0,
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
            hidden={!info?.type}
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
          <p className="font-extrabold text-small">{info?.data.views}</p>
        </div>
      </Tooltip>
      <Tooltip content={"Reposts"}>
        <div className="flex gap-2 items-center align-middle">
          <Button
            isIconOnly
            color="primary"
            variant="light"
            hidden={!info?.type}
          >
            <ArrowPathRoundedSquareIcon width={20} />
          </Button>
          <p className="font-extrabold text-small">
            {!info?.type ? null : stats.comments}
          </p>
        </div>
      </Tooltip>
      <Tooltip content={"Shares"}>
        <div className="flex gap-2 items-center align-middle">
          <Button
            hidden={!info?.type}
            isIconOnly
            color="primary"
            variant="light"
          >
            <ArrowRightStartOnRectangleIcon width={20} />
          </Button>
          <p className="font-extrabold text-small">
            {!info?.type ? null : stats.likes}
          </p>
        </div>
      </Tooltip>
      <Tooltip content={"Sparks"}>
        <div className="flex items-center align-middle">
          <Button
            isIconOnly
            color="primary"
            variant="light"
            hidden={!info?.type}
          >
            <FireIcon width={20} />
          </Button>
          <p className="font-extrabold text-small">
            {!info?.type ? null : stats.heat}
          </p>
        </div>
      </Tooltip>
    </>
  );
}
