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
import { useState } from "react";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { handleAddStatus } from "@/utils/handle-user-posting/handleStatusPost";
import Lottie from "lottie-react";
import hourglass from "@/public/lottie/hourglass.json";
import { useToast } from "@/app/providers/ToastProvider";
import confetti from "canvas-confetti";

type AddStatusProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddStatus({ isOpen, onOpenChange }: AddStatusProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const { data: session } = useSession();
  const user = session?.user;

  const submitStatus = async () => {
    if (!user) return;
    if (!content) return;
    if (loading) return;

    setLoading(true);
    try {
      await handleAddStatus({
        loggedInUser: user,
        content,
        attachments: newFiles,
      });
      setContent("");
      setNewFiles([]);
      onOpenChange(false);
      notify("Status posted 🤝", "");
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="xs"
      placement="center"
      backdrop="blur"
      scrollBehavior="inside"
      className="bg-transparent text-concrete h-auto"
      classNames={{ closeButton: "text-concrete" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-6">
                <Lottie animationData={hourglass} style={{ width: "12rem" }} />
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
                    isRequired={true}
                    variant="underlined"
                    color="secondary"
                    placeholder="What are you up to?"
                    className="mb-3 border-b-white border-b-2 placeholder:text-white"
                    classNames={{
                      input:
                        "placeholder:text-default-700/70 dark:placeholder:text-white/60", // <-- makes both placeholder + text white
                      clearButton: "text-concrete",
                    }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></Textarea>
                  <AttachmentUploader
                    onFilesSelected={(files) =>
                      setNewFiles((prev) => [...prev, ...files])
                    }
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="ghost"
                    onPress={() => console.log(`Save as draft function`)}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    color="primary"
                    variant="shadow"
                    onPress={submitStatus}
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
  );
}
