"use client";

import { Button } from "@heroui/button";
import { Alert } from "@heroui/react";
import { useRouter } from "next/navigation";

type EventDoc = {
  _id: string;
  status: string;
  [key: string]: any;
};

export function EventStatusHeader({
  status,
  event,
}: {
  status: string;
  event: EventDoc;
}) {
  const router = useRouter();

  if (status !== "canceled" && status !== "completed") return null;

  return (
    <div key={event._id} className="w-full flex items-center my-3">
      {status === "canceled" && (
        <Alert
          color="danger"
          title="Event Canceled"
          description="This event has been canceled by the host."
          variant="flat"
          endContent={
            <Button
              color="danger"
              size="sm"
              onPress={() => router.push(`/dashboard`)}
              variant="flat"
            >
              Go Back
            </Button>
          }
          classNames={{ description: "text-xs", base: "m-0" }}
        />
      )}

      {status === "completed" && (
        <Alert
          color="success"
          title="Event Completed"
          description="This event has already finished."
          variant="flat"
          endContent={
            <Button
              color="success"
              size="sm"
              onPress={() => router.push(`/dashboard`)}
              variant="flat"
            >
              Go Back
            </Button>
          }
          classNames={{ description: "text-xs", base: "m-0" }}
        />
      )}
    </div>
  );
}
