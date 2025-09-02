"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Modal, ModalContent, Spinner } from "@heroui/react";
import Image from "next/image";
import { UserDoc } from "@/lib/models/User";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import {
  CheckIcon,
  ChevronDoubleUpIcon,
  EllipsisVerticalIcon,
  FireIcon,
  FlagIcon,
  HandRaisedIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { ConfirmBanDialog } from "./banUserConfirmDialog";
import React from "react";
import Lottie from "lottie-react";
import notFound from "@/public/lottie/emptymessagenotifs.json";

type ManageOrbiterProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  hostId: string;
  eventIsPublic: boolean;
};

type Orbiters = Partial<UserDoc>[];

export function ManageOrbiter({
  isOpen,
  onClose,
  eventId,
  hostId,
  eventIsPublic,
}: ManageOrbiterProps) {
  const [orbiters, setOrbiters] = useState<Orbiters>([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState<
    | {
        id: string;
        name: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (!isOpen || !eventId) return;

    const fetchOrbiters = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}/get-attendees`);
        if (!res.ok) throw new Error("Failed to fetch attendees");
        const data = await res.json();
        console.log("Orbiters Data:", data);
        setOrbiters(data.attendees ?? []);
      } catch (err) {
        console.error("Error fetching orbiters:", err);
        setOrbiters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrbiters();
  }, [isOpen, eventId]); // 👈 add eventId here

  console.log(`Event Id from manage Orbiters: ${eventId}`);
  const router = useRouter();

  const banUser = async (hostId: string, userId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/ban-user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostId,
          userId,
          alsoUnfriend: false,
          alsoBlock: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to ban user");
      }

      const data = await res.json();
      console.log("Ban successful:", data);
      return data;
    } catch (err) {
      console.error("Error banning user:", err);
      throw err;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      size="xs"
      scrollBehavior="inside"
      backdrop="blur"
      className="bg-transparent text-concrete h-auto"
    >
      <ModalContent>
        <div className="flex-1 overflow-y-auto justify-center items-center">
          {loading ? (
            <div className="bg-transparent flex items-center justify-center">
              <Spinner variant="dots" color="primary" />
            </div>
          ) : orbiters.length === 0 ? (
            <div className="flex flex-col justify-center items-center space-y-3 p-3">
              <Lottie animationData={notFound} style={{ width: "9rem" }} />
              <h1 className="font-light">
                hmm.. No sign of life here just yet.
              </h1>
              <Button
                size="sm"
                variant="shadow"
                color="primary"
                onPress={onClose}
              >
                Back to Event
              </Button>
            </div>
          ) : (
            <div className="flex-1 p-3 overflow-y-auto justify-center items-center">
              <Image
                src={logo}
                width={600}
                alt="thirdspace-logo-white"
                className="justify-center"
                style={{ marginTop: "-7rem" }}
              ></Image>
              <ul className="space-y-4 w-full h-auto mt-[-6rem] z-10">
                {orbiters.map((orbiter) => (
                  <React.Fragment key={String(orbiter._id)}>
                    {banTarget && (
                      <ConfirmBanDialog
                        isOpen={!!banTarget}
                        onClose={() => setBanTarget(undefined)}
                        eventId={eventId}
                        hostId={hostId}
                        userId={banTarget.id}
                        userName={banTarget.name}
                        onSuccess={() =>
                          setOrbiters((prev) =>
                            prev.filter((o) => String(o._id) !== banTarget.id)
                          )
                        }
                      />
                    )}

                    <li className="flex items-center justify-between gap-3">
                      <div className="flex flex-row gap-3 items-center">
                        <Avatar
                          src={orbiter.avatar ?? "/misc/default-avatar.png"}
                          alt={orbiter.username ?? "user"}
                          size="md"
                          isBordered
                          color="primary"
                          className="rounded-full"
                          onClick={() =>
                            router.push(
                              `/dashboard/profile/${String(orbiter._id)}`
                            )
                          }
                        />
                        <div>
                          <p className="font-light">
                            {orbiter.firstName} {orbiter.lastName}
                          </p>
                          <p className="text-xs text-concrete/80 font-extralight">
                            @{orbiter.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row gap-1 justify-evenly flex-shrink-0">
                        <button
                          onClick={() =>
                            console.log(`Sending spark to ${orbiter.firstName}`)
                          }
                        >
                          <FireIcon
                            width={23}
                            className="text-white p-0.5 border-1 border-white bg-primary backdrop-blur-md rounded-full"
                          />
                        </button>
                        <button
                          onClick={() =>
                            console.log(
                              `Banning ${orbiter.firstName} from event`
                            )
                          }
                          className="rounded-full bg-white/10 backdrop-blur-lg border border-white/30 shadow-md hover:bg-white/20"
                        >
                          <CheckIcon
                            width={23}
                            className="text-white p-0.5 border-1 border-white bg-success backdrop-blur-md rounded-full"
                          />
                        </button>
                        {/* Dropdown for secondary actions */}
                        <Dropdown classNames={dropDownStyle} backdrop="blur">
                          <DropdownTrigger>
                            <button>
                              <EllipsisVerticalIcon
                                width={24}
                                className="text-white p-0.5 border-1 bg-white/20 border-white rounded-full backdrop-blur-md hover:bg-white/20"
                              />
                            </button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="promote"
                              description={`Grant a user host priveleges`}
                              onPress={() =>
                                console.log(`Unban ${orbiter.firstName}`)
                              }
                              endContent={<ChevronDoubleUpIcon width={23} />}
                            >
                              Promote
                            </DropdownItem>
                            {eventIsPublic ? null : (
                              <DropdownItem
                                key="ban"
                                endContent={<HandRaisedIcon width={23} />}
                                description={`Ban a user from this event`}
                                onPress={() =>
                                  setBanTarget({
                                    id: String(orbiter._id),
                                    name: `${orbiter.firstName} ${orbiter.lastName}`,
                                  })
                                }
                              >
                                Ban
                              </DropdownItem>
                            )}
                            <DropdownItem
                              key="restrict"
                              onPress={() =>
                                console.log(`Restrict ${orbiter.firstName}`)
                              }
                              description={`Restrict a user from event interaction`}
                              endContent={<NoSymbolIcon width={23} />}
                            >
                              Restrict{" "}
                            </DropdownItem>
                            <DropdownItem
                              key="report"
                              className="text-concrete"
                              description={`Report a user or file an appeal`}
                              onPress={() =>
                                console.log(`Report ${orbiter.firstName}`)
                              }
                              endContent={<FlagIcon width={23} />}
                            >
                              Report
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </li>
                  </React.Fragment>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
