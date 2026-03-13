"use client";

import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { Image } from "@heroui/react";
import { useState } from "react";
import EventDirectionsMap from "./eventDirectionsMap";

type DirectionsModalProps = {
  eventLat: number;
  eventLng: number;
  userLat?: number;
  userLng?: number;
  eventTitle?: string;
  eventAddress?: string;
};

export default function DirectionsModal({
  eventLat,
  eventLng,
  userLat,
  userLng,
  eventTitle,
  eventAddress,
}: DirectionsModalProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [routeInfo, setRouteInfo] = useState<{
    distanceMiles?: number;
    durationMinutes?: number;
  }>({});

  const hasUserLocation =
    typeof userLat === "number" && typeof userLng === "number";

  const openWazeDirections = () => {
    const url = `https://waze.com/ul?ll=${eventLat},${eventLng}&navigate=yes&utm_source=thirdspace`;
    window.open(url, "_blank");
  };

  const openGoogleMapsDirections = () => {
    const url = hasUserLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${eventLat},${eventLng}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${eventLat},${eventLng}&travelmode=driving`;

    window.open(url, "_blank");
  };

  return (
    <>
      <div className="absolute mt-[-1rem] flex flex-row items-center justify-center gap-2">
        <Button
          size="sm"
          variant="shadow"
          color="primary"
          className="text-tiny"
          onPress={onOpen}
          isIconOnly
        >
          <Image
            src="/icons/favicon.png"
            className="h-full rounded-md p-[3px]"
            alt="Open ThirdSpace directions preview"
          />
        </Button>

        <Button
          size="sm"
          variant="shadow"
          color="primary"
          className="rounded-none bg-transparent text-tiny"
          onPress={openGoogleMapsDirections}
          isIconOnly
        >
          <Image
            src="/icons/google-maps.png"
            className="h-full rounded-md"
            alt="Open Google Maps directions"
          />
        </Button>

        <Button
          size="sm"
          variant="shadow"
          color="secondary"
          className="rounded-none text-tiny"
          onPress={openWazeDirections}
          isIconOnly
        >
          <Image
            src="/icons/waze.png"
            className="h-full rounded-md"
            alt="Open Waze directions"
          />
        </Button>
      </div>

      <Modal
        backdrop="opaque"
        placement="center"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        hideCloseButton
        classNames={{
          base: "h-[100dvh] max-h-[100dvh] m-0 bg-black",
          wrapper: "p-0 m-0",
        }}
      >
        <ModalContent>
          <>
            <ModalHeader className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-4">
              <div className="max-w-[75%]">
                <div className="flex items-center gap-2">
                  <RocketLaunchIcon className="h-5 w-5 text-secondary" />
                  <p className="text-sm font-semibold text-white">
                    {eventTitle ?? "ThirdSpace Route Preview"}
                  </p>
                </div>

                {eventAddress && (
                  <p className="mt-1 text-xs text-white/70">{eventAddress}</p>
                )}

                {routeInfo.distanceMiles && routeInfo.durationMinutes && (
                  <p className="mt-1 text-xs text-white/70">
                    {routeInfo.distanceMiles.toFixed(1)} mi •{" "}
                    {routeInfo.durationMinutes} min
                  </p>
                )}
              </div>

              <Button
                isIconOnly
                radius="full"
                variant="solid"
                onPress={onClose}
                className="bg-transparent font-bold text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </ModalHeader>

            <ModalBody className="relative h-[100dvh] p-0">
              <EventDirectionsMap
                eventLat={eventLat}
                eventLng={eventLng}
                userLat={userLat}
                userLng={userLng}
                onRouteInfoChange={setRouteInfo}
              />

              <div className="absolute bottom-0 left-0 right-0 z-20">
                <div className="rounded-none border-t border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
                  <div className="flex items-center justify-center gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Navigation Options
                      </p>
                      <p className="text-xs text-white/60">
                        Preview in-app or continue in your preferred maps app
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-row gap-2">
                    <Button
                      size="sm"
                      color="primary"
                      className="flex-1"
                      startContent={
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      }
                      onPress={openGoogleMapsDirections}
                    >
                      Google Maps
                    </Button>

                    <Button
                      size="sm"
                      color="secondary"
                      className="flex-1 text-primary"
                      startContent={
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      }
                      onPress={openWazeDirections}
                    >
                      Waze
                    </Button>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="hidden" />
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
