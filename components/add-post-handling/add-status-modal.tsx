import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import AttachmentSwiper from "../swiper/swiper";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import AttachmentUploader from "../attachment-uploader/attachmentUploader";
import { useRef, useState } from "react";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { handleAddStatus } from "@/utils/handle-user-posting/handleStatusPost";
import Lottie from "lottie-react";
import hourglass from "@/public/lottie/hourglass.json";
import { useToast } from "@/app/providers/ToastProvider";
import confetti from "canvas-confetti";
import { useFeed } from "@/app/context/UserFeedContext";
import { FeedItem } from "@/types/user-feed";
import KarmaRewardToast from "../karma/KarmaRewardToast";
import { useUserInfo } from "@/app/context/UserContext";
import { XCircleIcon } from "@heroicons/react/24/solid";

type AddStatusProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusPosted?: () => void | Promise<void>;
};

export default function AddStatus({
  isOpen,
  onOpenChange,
  onStatusPosted,
}: AddStatusProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState("");
  const [loading, setLoading] = useState(false);
  const useRefOnSubmit = useRef(false);
  const { notify } = useToast();
  const { data: session, update } = useSession();
  const user = session?.user;
  const { karmaScore, setKarmaScore, setRank } = useUserInfo();
  const feed = useFeed();

  const MIN_STATUS_LENGTH = 8;
  const trimmedContent = content.trim();
  const isStatusValid = trimmedContent.length >= MIN_STATUS_LENGTH;

  const [karmaReward, setKarmaReward] = useState<{
    label: string;
    amount: number;
  } | null>(null);

  const submitStatus = async () => {
    if (useRefOnSubmit.current) return;
    useRefOnSubmit.current = true;

    try {
      if (!user) return;

      const trimmedContent = content.trim();
      if (trimmedContent.length < MIN_STATUS_LENGTH) return;

      setLoading(true);

      const data = await handleAddStatus({
        loggedInUser: user,
        content,
        attachments: newFiles,
      });

      const { rewardKarma, ok, newRank, totalKarma } = data;

      if (ok) {
        await onStatusPosted?.();
        setContent("");
        setNewFiles([]);
        onOpenChange(false);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });

        setKarmaReward({
          label: "Posted New Status!",
          amount: rewardKarma,
        });
        setKarmaScore(totalKarma);
        setRank(newRank);

        if (rewardKarma === 0) {
          notify(
            "Status Posted 🤝",
            `Check back in tomorrow to earn more karma!`,
          );
        }
      }
    } finally {
      setLoading(false);
      useRefOnSubmit.current = false;
      feed.refresh?.();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xs"
        placement="center"
        backdrop="blur"
        scrollBehavior="inside"
        className="bg-transparent text-concrete h-auto"
        classNames={{ closeButton: "text-concrete" }}
        isDismissable={!loading}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {loading ? (
                <div className="flex flex-col justify-center items-center py-6">
                  <Lottie
                    animationData={hourglass}
                    style={{ width: "12rem" }}
                  />
                  <h1>Posting status. One moment!</h1>
                </div>
              ) : (
                <>
                  {" "}
                  <Image
                    src={logo}
                    width={600}
                    alt="thirdspace-logo-white"
                    className="justify-center p-0"
                    style={{ marginTop: "-6rem" }}
                  ></Image>
                  <ModalBody className="mt-[-7rem] overflow-y-auto">
                    <Textarea
                      isRequired
                      isInvalid={!!contentError}
                      errorMessage={contentError}
                      variant="underlined"
                      color="secondary"
                      placeholder="What's going on today?"
                      classNames={{
                        input:
                          "placeholder:text-default-700/70 dark:placeholder:text-white/60", // <-- makes both placeholder + text white
                        clearButton: "text-concrete",
                        errorMessage: "text-sm text-center mt-1 border-none",
                      }}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    ></Textarea>
                    <p className="text-xs text-center text-white/70 mt-1">
                      {trimmedContent.length < MIN_STATUS_LENGTH
                        ? `Write at least ${MIN_STATUS_LENGTH} characters`
                        : `${trimmedContent.length} characters`}
                    </p>
                    <AttachmentUploader
                      onFilesSelected={(files) =>
                        setNewFiles((prev) => [...prev, ...files])
                      }
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      type="submit"
                      size="sm"
                      color="primary"
                      variant="shadow"
                      onPress={submitStatus}
                      isDisabled={loading || !isStatusValid}
                      isLoading={loading}
                    >
                      Post
                    </Button>
                  </ModalFooter>{" "}
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
      {karmaReward
        ? karmaReward.amount > 0 && (
            <KarmaRewardToast
              open={!!karmaReward}
              label={karmaReward?.label ?? ""}
              amount={karmaReward?.amount ?? 0}
              onDone={() => setKarmaReward(null)}
            />
          )
        : null}
    </>
  );
}
