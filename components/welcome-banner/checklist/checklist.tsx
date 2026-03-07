"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import ProfileSettingsModal from "@/components/profile-settings/profileSettings";
import { UserDoc } from "@/lib/models/User";
import { didNewUserPost } from "@/utils/frontend-backend-connection/checkNewUserPost";
import { markComplete } from "@/utils/onboarding/onboarding";
import {
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";
import AddStatus from "@/components/add-post-handling/add-status-modal";

type MissionItem = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  sessionUser: UserDoc;
  statusJustPosted?: boolean;
  visibilityWasSet?: boolean;
  tagsWereSet?: boolean;
  handleVisibilitySet?: () => void;
  handleStatusPosted?: () => void;
  handleSetTags?: () => void;
  onStatusPosted?: () => void | Promise<void>;
  refreshUserdoc: () => Promise<void>;
  onOpenStatus?: () => void;
};

const MISSIONS: MissionItem[] = [
  {
    value: "account",
    label: "Add a few hobbies and interests ✨",
    description: "Help improve your recommendations.",
  },
  {
    value: "privacy",
    label: "Review your privacy settings 🔒",
    description: "Make sure your visibility is set how you want it.",
  },
  {
    value: "status",
    label: "Make your first ThirdSpace™ post 📝",
    description: "Let the world know that you've landed.",
  },
];

export default function MissionChecklist({
  sessionUser,
  statusJustPosted = false,
  visibilityWasSet = false,
  tagsWereSet = false,
  handleVisibilitySet,
  handleStatusPosted,
  handleSetTags,
  refreshUserdoc,
  onOpenStatus,
}: Props) {
  const [newPost, setNewPost] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const hasMarkedComplete = useRef(false);

  useEffect(() => {
    const checkPost = async () => {
      const res = await didNewUserPost(sessionUser);
      setNewPost(!!res.postedStatus);
    };

    checkPost();
  }, [sessionUser, statusJustPosted]);

  useEffect(() => {
    console.log("statusJustPosted changed:", statusJustPosted);
  }, [statusJustPosted]);

  const derivedCompleted = useMemo(() => {
    return [
      ...(sessionUser?.tags?.length || tagsWereSet ? ["account"] : []),
      ...(sessionUser?.visibility || visibilityWasSet ? ["privacy"] : []),
      ...(newPost || statusJustPosted ? ["status"] : []),
    ];
  }, [sessionUser, newPost, statusJustPosted, visibilityWasSet]);

  const completedSet = useMemo(
    () => new Set(derivedCompleted),
    [derivedCompleted],
  );

  const completedCount = derivedCompleted.length;
  const totalCount = MISSIONS.length;
  const allComplete = completedCount === totalCount;

  useEffect(() => {
    if (!allComplete || hasMarkedComplete.current) return;

    const completeOnboard = async () => {
      await markComplete(sessionUser);
      hasMarkedComplete.current = true;
    };

    completeOnboard();
  }, [allComplete, sessionUser]);

  const progressLabel = `${completedCount} of ${totalCount} completed`;

  const triggerFunction = (value: string) => {
    switch (value) {
      case "account":
        setOpenTabs(["account"]);
        setIsSettingsOpen(true);
        break;

      case "privacy":
        setOpenTabs(["privacy", "security"]);
        setIsSettingsOpen(true);
        break;

      case "status":
        setOpenModal(true);
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Card className="w-full rounded-none bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-cyan-500/30 p-0 mt-4 mb-[-12px] shadow-lg">
        <CardBody className="bg-black/40 backdrop-blur-xl p-4 pb-6">
          {allComplete ? (
            <div className="flex flex-col items-center justify-center text-center py-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                Mission Complete 🚀
              </h3>
              <p className="text-xs text-white/75 max-w-sm">
                You’re cleared for orbit. Explore the Solar System and dock at
                the Space Station whenever you’re ready.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-center flex-col items-center">
                <h3 className="text-sm font-semibold text-white">
                  Mission Objectives 🚀
                </h3>
                <p className="text-xs text-white/75">{progressLabel}</p>
              </div>

              <div className="flex flex-col gap-4">
                {MISSIONS.map((mission) => {
                  const isComplete = completedSet.has(mission.value);

                  return (
                    <div
                      key={mission.value}
                      className={`w-full rounded-xl px-3 py-3 transition-colors ${
                        isComplete
                          ? "bg-emerald-500/15 border border-emerald-400/30"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            <CheckCircleIcon
                              className={`w-5 h-5 ${
                                isComplete
                                  ? "text-emerald-400"
                                  : "text-white/25"
                              }`}
                            />
                          </div>

                          <div className="flex flex-col">
                            <span
                              className={`text-sm ${
                                isComplete ? "text-white/70" : "text-white"
                              }`}
                            >
                              {mission.label}
                            </span>

                            {mission.description ? (
                              <span className="text-xs text-white/65">
                                {mission.description}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={isComplete ? "flat" : "solid"}
                          color={isComplete ? "default" : "primary"}
                          isDisabled={isComplete}
                          onPress={() => triggerFunction(mission.value)}
                          startContent={
                            !isComplete ? (
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            ) : undefined
                          }
                        >
                          {isComplete ? "Done" : "Go"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        accountTabsOpen={openTabs}
        onSetVisibility={handleVisibilitySet}
        onSetTags={handleSetTags}
      />
      <AddStatus
        isOpen={openModal}
        onOpenChange={(open: boolean) => {
          if (!open) setOpenModal(false);
          else setOpenModal(true);
        }}
        onStatusPosted={handleStatusPosted}
      />
    </>
  );
}
