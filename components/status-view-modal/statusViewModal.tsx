import { Modal, ModalContent, Spinner, ModalBody, Avatar } from "@heroui/react";
import { useState, useEffect } from "react";
import AttachmentSwiper from "../swiper/swiper";
import {
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  FireIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowPathRoundedSquareIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";

import { FireIcon as FireSolid } from "@heroicons/react/24/solid";
import Lottie from "lottie-react";
import fire from "@/public/lottie/fire.json";
import { useRouter } from "next/navigation";
import CommentList from "../comment-handling/status/CommentListForStatuses";
import { UserStatusDoc } from "@/lib/models/User";
import { useSession } from "next-auth/react";
import { SessionUser } from "@/types/user-session";

type Props = {
  statusId: string;
  hasSparked: boolean;
  textOnly: boolean;
  onClose: () => void;
  onSparkStatus: (statusId: string) => void;
};

export default function StatusDetailModal({
  statusId,
  hasSparked,
  textOnly,
  onClose,
  onSparkStatus,
}: Props) {
  const [status, setStatus] = useState<UserStatusDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSparkPulse, setShowSparkPulse] = useState(false);

  // toggles
  const [showComments, setShowComments] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  const router = useRouter();
  const session = useSession();
  const hasText = Boolean((status as any)?.content?.trim()); // or status.content if it exists on your type
  const hasAttachments = (status?.attachments?.length ?? 0) > 0;
  const isTextOnly = hasText && !hasAttachments;

  const handleSpark = async () => {
    if (!hasSparked) {
      setShowSparkPulse(true);
      setTimeout(() => setShowSparkPulse(false), 2000);
    }
    onSparkStatus(statusId);
  };

  useEffect(() => {
    if (!session.data?.user || !status) return;
    setUser(session.data?.user);
    setIsAuthor(String(session.data.user.id) === String(status.userId));
  }, [session.data?.user, status]);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(`/api/status/${statusId}`);
      const data = await res.json();
      setStatus(data);
      setLoading(false);
    };

    fetchStatus();
  }, [statusId]);

  if (!status) return null;

  const handleShare = async () => {
    // placeholder
    console.log("share status", statusId);
  };

  const handleRepost = async () => {
    console.log("repost status");
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="full"
      placement="center"
      radius="none"
      backdrop="blur"
      isDismissable={false}
      classNames={{
        base: "animate-slideIn border-none",
        wrapper: "p-0 border-none",
        body: "p-0 overflow-y-auto border-none",
        header: "p-0 border-none",
        footer: "p-0",
        closeButton: "z-50 bg-black/80 text-secondary border-none",
      }}
      className="animate-slide-down overflow-y-auto"
    >
      <ModalContent className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Spinner />
          </div>
        ) : (
          <>
            <ModalBody className="p-0 h-[90vh] flex flex-col overflow-hidden min-h-0">
              {/* CONTENT AREA */}
              {hasAttachments ? (
                // ===== MEDIA-FIRST LAYOUT (your current) =====
                <div
                  className={`relative w-full flex-none transition-all duration-300 ease-in-out ${
                    showComments ? "h-[50vh]" : "h-[100vh]"
                  }`}
                >
                  {showSparkPulse && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <FireSolid className="w-20 h-20 text-secondary animate-[pulse_1.2s_ease-in-out_1]" />
                    </div>
                  )}
                  <div
                    className="absolute top-3 left-1 z-20 flex items-center gap-2 bg-black/40 backdrop-blur px-2 py-1 rounded-full"
                    onClick={() =>
                      router.push(
                        `/dashboard/profile/${status.userId.toString()}`,
                      )
                    }
                  >
                    <Avatar
                      src={status.authorAvatar}
                      isBordered
                      color="primary"
                      size="sm"
                    />
                    <span className="text-sm font-medium text-white">
                      {status.author}
                    </span>
                  </div>
                  <AttachmentSwiper
                    hidePlayButton={true}
                    controls={true}
                    attachments={status.attachments}
                    commentsAreOpen={showComments}
                  />
                  {/* spark pulse, author pill, action rail... keep as-is */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="flex flex-col gap-3 pointer-events-auto">
                      <button
                        className={`${!showComments ? "bg-black/40" : "bg-primary"} backdrop-blur rounded-full p-2`}
                        onClick={() => setShowComments((v) => !v)}
                        aria-label="Toggle comments"
                      >
                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
                      </button>

                      <button
                        className={`${hasSparked ? "bg-primary" : "bg-black/40"} backdrop-blur rounded-full p-2`}
                        onClick={handleSpark}
                        aria-label="Spark"
                      >
                        <FireSolid className="w-5 h-5 text-secondary transition-all" />
                      </button>

                      <button
                        className="bg-black/40 backdrop-blur rounded-full p-2"
                        onClick={handleShare}
                      >
                        <PaperAirplaneIcon className="h-5 w-5 text-white" />
                      </button>

                      <button
                        className="bg-black/40 backdrop-blur rounded-full p-2"
                        onClick={handleRepost}
                      >
                        <ArrowPathRoundedSquareIcon className="h-5 w-5 text-white" />
                      </button>

                      {isAuthor && (
                        <button
                          className="bg-black/40 backdrop-blur rounded-full p-2"
                          onClick={handleRepost}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // ===== TEXT-FIRST LAYOUT =====
                <div className="relative w-full flex-1 min-h-0 bg-black">
                  {showSparkPulse && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <FireSolid className="w-20 h-20 text-secondary animate-[pulse_1.2s_ease-in-out_1]" />
                    </div>
                  )}
                  {/* Author pill (reuse the same pill) */}
                  <div
                    className="absolute top-3 left-1 z-20 flex items-center gap-2 bg-black/40 backdrop-blur px-2 py-1 rounded-full"
                    onClick={() =>
                      router.push(
                        `/dashboard/profile/${status.userId.toString()}`,
                      )
                    }
                  >
                    <Avatar
                      src={status.authorAvatar}
                      isBordered
                      color="primary"
                      size="sm"
                    />
                    <span className="text-sm font-medium text-white">
                      {status.author}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="h-full flex flex-col justify-center px-14 pt-16 pb-6">
                    <p className="text-white text-xl font-medium leading-relaxed text-center">
                      {(status as any)?.content}
                    </p>
                  </div>

                  {/* Action rail (same as your current rail) */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="flex flex-col gap-3 pointer-events-auto">
                      <button
                        className={`${!showComments ? "bg-black/40" : "bg-primary"} backdrop-blur rounded-full p-2`}
                        onClick={() => setShowComments((v) => !v)}
                        aria-label="Toggle comments"
                      >
                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white" />
                      </button>

                      <button
                        className={`${hasSparked ? "bg-primary" : "bg-black/40"} backdrop-blur rounded-full p-2`}
                        onClick={handleSpark}
                        aria-label="Spark"
                      >
                        <FireSolid className="w-5 h-5 text-secondary transition-all" />
                      </button>

                      <button
                        className="bg-black/40 backdrop-blur rounded-full p-2"
                        onClick={handleShare}
                      >
                        <PaperAirplaneIcon className="h-5 w-5 text-white" />
                      </button>

                      <button
                        className="bg-black/40 backdrop-blur rounded-full p-2"
                        onClick={handleRepost}
                      >
                        <ArrowPathRoundedSquareIcon className="h-5 w-5 text-white" />
                      </button>

                      {isAuthor && (
                        <button
                          className="bg-black/40 backdrop-blur rounded-full p-2"
                          onClick={handleRepost}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {showComments ? (
                <div className="flex-1 overflow-y-auto h-[100vh] bg-transparent mt-3">
                  <CommentList
                    statusId={String(status._id)}
                    authorId={String(status.userId)}
                    author={status.author}
                    isAuthor={isAuthor}
                  />
                </div>
              ) : null}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
